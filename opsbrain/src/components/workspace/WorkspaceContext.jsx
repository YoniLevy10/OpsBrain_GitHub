import React, { createContext, useContext } from 'react';
import { useAuth } from '@/lib/AuthContext';

const WorkspaceContext = createContext();

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
};

export const WorkspaceProvider = ({ children }) => {
  const {
    activeWorkspace,
    workspaces,
    loading,
    switchWorkspace,
    createWorkspace,
  } = useAuth();

  return (
    <WorkspaceContext.Provider
      value={{
        activeWorkspace,
        workspaces,
        loading,
        switchWorkspace,
        createWorkspace,
        refreshWorkspaces: () => {},
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};