import React from 'react';
import { UserProfile } from '@clerk/clerk-react';

export default function UserProfilePage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingTop: '2rem' }}>
      <UserProfile path="/user" routing="path" />
    </div>
  );
}
