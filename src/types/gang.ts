export interface GangMember {
  id: string;
  username: string;
  role: 'leader' | 'lieutenant' | 'soldier';
  joinedAt: string;
  reputation: number;
}

export interface Gang {
  id: string;
  name: string;
  description: string;
  philosophy: 'escape' | 'control' | 'survival';
  leader: string;
  members: GangMember[];
  territory: string[];
  reputation: number;
  stats: {
    strength: number;
    defense: number;
    influence: number;
  };
  createdAt: string;
}

export interface GangInvite {
  id: string;
  gangId: string;
  gangName: string;
  inviterId: string;
  inviterName: string;
  inviteeId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}
