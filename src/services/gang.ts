import { db } from '../firebase';
import { doc, collection, addDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { Gang, GangMember, GangInvite } from '../types/gang';
import { v4 as uuidv4 } from 'uuid';

export const GangService = {
  async createGang(
    leaderId: string,
    name: string,
    description: string,
    philosophy: Gang['philosophy']
  ): Promise<Gang> {
    const gang: Gang = {
      id: uuidv4(),
      name,
      description,
      philosophy,
      leader: leaderId,
      members: [{
        id: leaderId,
        username: '', // Will be filled from user data
        role: 'leader',
        joinedAt: new Date().toISOString(),
        reputation: 0
      }],
      territory: [],
      reputation: 0,
      stats: {
        strength: 1,
        defense: 1,
        influence: 1
      },
      createdAt: new Date().toISOString()
    };

    await addDoc(collection(db, 'gangs'), gang);
    return gang;
  },

  async inviteMember(gangId: string, inviterId: string, inviteeId: string): Promise<void> {
    const invite: GangInvite = {
      id: uuidv4(),
      gangId,
      gangName: '', // Will be filled from gang data
      inviterId,
      inviterName: '', // Will be filled from user data
      inviteeId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    await addDoc(collection(db, 'gangInvites'), invite);
  },

  async respondToInvite(inviteId: string, accept: boolean): Promise<void> {
    const inviteRef = doc(db, 'gangInvites', inviteId);
    await updateDoc(inviteRef, {
      status: accept ? 'accepted' : 'rejected'
    });

    if (accept) {
      // Add member to gang
      const invite = (await getDocs(query(
        collection(db, 'gangInvites'),
        where('id', '==', inviteId)
      ))).docs[0].data() as GangInvite;

      const gangRef = doc(db, 'gangs', invite.gangId);
      await updateDoc(gangRef, {
        members: [{
          id: invite.inviteeId,
          username: '', // Will be filled from user data
          role: 'soldier',
          joinedAt: new Date().toISOString(),
          reputation: 0
        }]
      });
    }
  },

  async leaveGang(gangId: string, memberId: string): Promise<void> {
    const gangRef = doc(db, 'gangs', gangId);
    const gang = (await getDocs(query(
      collection(db, 'gangs'),
      where('id', '==', gangId)
    ))).docs[0].data() as Gang;

    if (gang.leader === memberId) {
      // Transfer leadership to highest ranking member
      const newLeader = gang.members
        .filter(m => m.id !== memberId)
        .sort((a, b) => b.reputation - a.reputation)[0];

      if (newLeader) {
        await updateDoc(gangRef, {
          leader: newLeader.id,
          members: gang.members
            .filter(m => m.id !== memberId)
            .map(m => m.id === newLeader.id ? { ...m, role: 'leader' } : m)
        });
      } else {
        // No other members, delete gang
        await updateDoc(gangRef, { deleted: true });
      }
    } else {
      // Just remove member
      await updateDoc(gangRef, {
        members: gang.members.filter(m => m.id !== memberId)
      });
    }
  }
};
