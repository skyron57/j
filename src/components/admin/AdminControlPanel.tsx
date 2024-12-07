import React, { useState } from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import { NPCManagement } from './NPCManagement';
import { GuardManagement } from './GuardManagement';

const AdminControlPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      <Tabs value={activeTab} onChange={handleTabChange}>
        <Tab label="Manage NPCs" />
        <Tab label="Manage Guards" />
      </Tabs>
      <Box>
        {activeTab === 0 && <NPCManagement />}
        {activeTab === 1 && <GuardManagement />}
      </Box>
    </Box>
  );
};

export default AdminControlPanel;
