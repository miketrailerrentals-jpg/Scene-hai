import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  runTransaction,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import * as fs from 'fs';
import { test, before, after, beforeEach, describe } from 'node:test';
import * as assert from 'node:assert';

const PROJECT_ID = 'gen-lang-client-0648193037';
const DATABASE_ID = 'ai-studio-scenehai-4494a13b-a264-4565-aaaa-f1f82a750460';
const rules = fs.readFileSync('firestore.rules', 'utf8');

let testEnv: RulesTestEnvironment;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules,
      host: '127.0.0.1',
      port: 8080
    }
  });
});

after(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

beforeEach(async () => {
  if (testEnv) {
    await testEnv.clearFirestore();
  }
});

describe('Scene Hai? Firestore Security Rules Verification Suite', () => {
  // Helper setup
  const hostUid = 'host-user-123';
  const attendeeUid = 'attendee-user-456';
  const attendee2Uid = 'attendee-user-789';
  const strangerUid = 'stranger-user-999';
  const sceneId = 'scene-chai-lahore';

  async function seedBasicData() {
    await testEnv.withSecurityRulesDisabled(async context => {
      const db = context.firestore();
      // Host profile
      await setDoc(doc(db, 'users', hostUid), {
        displayName: 'Ahmad Host',
        city: 'Lahore',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      // Attendee profile
      await setDoc(doc(db, 'users', attendeeUid), {
        displayName: 'Bilal Guest',
        city: 'Lahore',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      // Attendee 2 profile
      await setDoc(doc(db, 'users', attendee2Uid), {
        displayName: 'Hamza Guest',
        city: 'Lahore',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      // Scene: capacity = 3 (Host + 2 guests max)
      const futureDate = new Date(Date.now() + 86400000 * 5); // 5 days in future
      await setDoc(doc(db, 'scenes', sceneId), {
        hostId: hostUid,
        hostDisplayName: 'Ahmad Host',
        title: 'Sunday Morning Chai & Code',
        description: 'Meetup at coffee place in DHA Phase 5 to chat about tech and build apps.',
        category: 'tech',
        city: 'Lahore',
        area: 'DHA Phase 5',
        venue: 'Meetup spot shared after approval',
        startsAt: Timestamp.fromDate(futureDate),
        timezone: 'Asia/Karachi',
        budgetPerPerson: 500,
        maxParticipants: 3, // Host=1, capacity for 2 approved participants
        approvedCount: 0,
        privacy: 'public',
        status: 'active',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      // Private venue details
      await setDoc(doc(db, 'scenes', sceneId, 'privateDetails', 'location'), {
        venue: 'Mocca Coffee, Sector CCA, Phase 5, Lahore - Table 4 on first floor',
        hostNotes: 'Ask for Ahmad at the counter',
        updatedAt: Timestamp.now()
      });
    });
  }

  test('1. Unauthenticated users: can read public scene, but CANNOT write or read private details', async () => {
    await seedBasicData();
    const guestDb = testEnv.unauthenticatedContext().firestore();

    // 1A. Can read public active scene
    await assertSucceeds(getDoc(doc(guestDb, 'scenes', sceneId)));

    // 1B. CANNOT read privateDetails/location
    await assertFails(getDoc(doc(guestDb, 'scenes', sceneId, 'privateDetails', 'location')));

    // 1C. CANNOT write to scene
    await assertFails(updateDoc(doc(guestDb, 'scenes', sceneId), { title: 'Hacked Title' }));

    // 1D. CANNOT create join request
    await assertFails(
      setDoc(doc(guestDb, 'scenes', sceneId, 'joinRequests', 'anon'), {
        requesterId: 'anon',
        requesterDisplayName: 'Anon',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    );
  });

  test('2. Profile Isolation: User can only read and write their own profile', async () => {
    await seedBasicData();
    const attendeeDb = testEnv.authenticatedContext(attendeeUid).firestore();
    const strangerDb = testEnv.authenticatedContext(strangerUid).firestore();

    // Attendee reads own profile -> succeeds
    await assertSucceeds(getDoc(doc(attendeeDb, 'users', attendeeUid)));

    // Stranger tries to read Attendee profile -> fails
    await assertFails(getDoc(doc(strangerDb, 'users', attendeeUid)));

    // Stranger tries to modify Attendee profile -> fails
    await assertFails(updateDoc(doc(strangerDb, 'users', attendeeUid), { displayName: 'Compromised' }));
  });

  test('3. Join Request: Requester can submit pending request; Host cannot request own scene', async () => {
    await seedBasicData();
    const attendeeDb = testEnv.authenticatedContext(attendeeUid).firestore();
    const hostDb = testEnv.authenticatedContext(hostUid).firestore();

    // Attendee submits pending request -> succeeds
    await assertSucceeds(
      setDoc(doc(attendeeDb, 'scenes', sceneId, 'joinRequests', attendeeUid), {
        requesterId: attendeeUid,
        requesterDisplayName: 'Bilal Guest',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    );

    // Host tries to request to join their own scene -> fails
    await assertFails(
      setDoc(doc(hostDb, 'scenes', sceneId, 'joinRequests', hostUid), {
        requesterId: hostUid,
        requesterDisplayName: 'Ahmad Host',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    );

    // Requester cannot forge status to 'approved' directly -> fails
    await assertFails(
      setDoc(doc(attendeeDb, 'scenes', sceneId, 'joinRequests', 'attacker'), {
        requesterId: 'attacker',
        requesterDisplayName: 'Attacker',
        status: 'approved',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    );
  });

  test('4. Third-party privacy: Strangers CANNOT read other users join requests', async () => {
    await seedBasicData();
    // Seed pending request
    await testEnv.withSecurityRulesDisabled(async context => {
      const db = context.firestore();
      await setDoc(doc(db, 'scenes', sceneId, 'joinRequests', attendeeUid), {
        requesterId: attendeeUid,
        requesterDisplayName: 'Bilal Guest',
        status: 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    });

    const attendeeDb = testEnv.authenticatedContext(attendeeUid).firestore();
    const hostDb = testEnv.authenticatedContext(hostUid).firestore();
    const strangerDb = testEnv.authenticatedContext(strangerUid).firestore();

    // Requester can read own request -> succeeds
    await assertSucceeds(getDoc(doc(attendeeDb, 'scenes', sceneId, 'joinRequests', attendeeUid)));

    // Host can read request on their scene -> succeeds
    await assertSucceeds(getDoc(doc(hostDb, 'scenes', sceneId, 'joinRequests', attendeeUid)));

    // Stranger cannot read requester join request -> fails
    await assertFails(getDoc(doc(strangerDb, 'scenes', sceneId, 'joinRequests', attendeeUid)));
  });

  test('5. Atomic Host Approval: requires synchronous request update + scene counter increment', async () => {
    await seedBasicData();
    // Seed pending request
    await testEnv.withSecurityRulesDisabled(async context => {
      const db = context.firestore();
      await setDoc(doc(db, 'scenes', sceneId, 'joinRequests', attendeeUid), {
        requesterId: attendeeUid,
        requesterDisplayName: 'Bilal Guest',
        status: 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    });

    const hostDb = testEnv.authenticatedContext(hostUid).firestore();
    const attendeeDb = testEnv.authenticatedContext(attendeeUid).firestore();
    const strangerDb = testEnv.authenticatedContext(strangerUid).firestore();

    // 5A. Non-host attempts to approve -> fails
    await assertFails(
      runTransaction(attendeeDb, async tx => {
        tx.update(doc(attendeeDb, 'scenes', sceneId, 'joinRequests', attendeeUid), {
          status: 'approved',
          decidedAt: serverTimestamp(),
          decidedBy: attendeeUid,
          updatedAt: serverTimestamp()
        });
        tx.update(doc(attendeeDb, 'scenes', sceneId), {
          approvedCount: 1,
          lastApprovedRequesterId: attendeeUid,
          updatedAt: serverTimestamp()
        });
      })
    );

    // 5B. Malicious host attempts to increment approvedCount WITHOUT approving request -> fails
    await assertFails(
      updateDoc(doc(hostDb, 'scenes', sceneId), {
        approvedCount: 1,
        updatedAt: serverTimestamp()
      })
    );

    // 5C. Malicious host attempts to approve request WITHOUT incrementing counter -> fails
    await assertFails(
      updateDoc(doc(hostDb, 'scenes', sceneId, 'joinRequests', attendeeUid), {
        status: 'approved',
        decidedAt: serverTimestamp(),
        decidedBy: hostUid,
        updatedAt: serverTimestamp()
      })
    );

    // 5D. Valid atomic transaction by Host -> SUCCEEDS
    await assertSucceeds(
      runTransaction(hostDb, async tx => {
        tx.update(doc(hostDb, 'scenes', sceneId, 'joinRequests', attendeeUid), {
          status: 'approved',
          decidedAt: serverTimestamp(),
          decidedBy: hostUid,
          updatedAt: serverTimestamp()
        });
        tx.update(doc(hostDb, 'scenes', sceneId), {
          approvedCount: 1,
          lastApprovedRequesterId: attendeeUid,
          updatedAt: serverTimestamp()
        });
      })
    );

    // 5E. Duplicate approval on already approved request -> fails
    await assertFails(
      runTransaction(hostDb, async tx => {
        tx.update(doc(hostDb, 'scenes', sceneId, 'joinRequests', attendeeUid), {
          status: 'approved',
          decidedAt: serverTimestamp(),
          decidedBy: hostUid,
          updatedAt: serverTimestamp()
        });
        tx.update(doc(hostDb, 'scenes', sceneId), {
          approvedCount: 2,
          lastApprovedRequesterId: attendeeUid,
          updatedAt: serverTimestamp()
        });
      })
    );
  });

  test('6. Host Decline: updates request to declined, does NOT change capacity', async () => {
    await seedBasicData();
    await testEnv.withSecurityRulesDisabled(async context => {
      const db = context.firestore();
      await setDoc(doc(db, 'scenes', sceneId, 'joinRequests', attendeeUid), {
        requesterId: attendeeUid,
        requesterDisplayName: 'Bilal Guest',
        status: 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    });

    const hostDb = testEnv.authenticatedContext(hostUid).firestore();
    const strangerDb = testEnv.authenticatedContext(strangerUid).firestore();

    // Stranger cannot decline -> fails
    await assertFails(
      updateDoc(doc(strangerDb, 'scenes', sceneId, 'joinRequests', attendeeUid), {
        status: 'declined',
        decidedAt: serverTimestamp(),
        decidedBy: strangerUid,
        updatedAt: serverTimestamp()
      })
    );

    // Host declines -> succeeds
    await assertSucceeds(
      updateDoc(doc(hostDb, 'scenes', sceneId, 'joinRequests', attendeeUid), {
        status: 'declined',
        decidedAt: serverTimestamp(),
        decidedBy: hostUid,
        updatedAt: serverTimestamp()
      })
    );

    // Terminal check: Declined request cannot be modified further -> fails
    await assertFails(
      updateDoc(doc(hostDb, 'scenes', sceneId, 'joinRequests', attendeeUid), {
        status: 'pending',
        updatedAt: serverTimestamp()
      })
    );
  });

  test('7. Participant Leaves: atomically decrements approvedCount and updates status to left', async () => {
    await seedBasicData();
    // Seed approved state (approvedCount = 1)
    await testEnv.withSecurityRulesDisabled(async context => {
      const db = context.firestore();
      await updateDoc(doc(db, 'scenes', sceneId), {
        approvedCount: 1,
        updatedAt: Timestamp.now()
      });
      await setDoc(doc(db, 'scenes', sceneId, 'joinRequests', attendeeUid), {
        requesterId: attendeeUid,
        requesterDisplayName: 'Bilal Guest',
        status: 'approved',
        decidedAt: Timestamp.now(),
        decidedBy: hostUid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    });

    const attendeeDb = testEnv.authenticatedContext(attendeeUid).firestore();
    const strangerDb = testEnv.authenticatedContext(strangerUid).firestore();

    // 7A. Stranger cannot leave for Attendee -> fails
    await assertFails(
      runTransaction(strangerDb, async tx => {
        tx.update(doc(strangerDb, 'scenes', sceneId, 'joinRequests', attendeeUid), {
          status: 'left',
          updatedAt: serverTimestamp()
        });
        tx.update(doc(strangerDb, 'scenes', sceneId), {
          approvedCount: 0,
          updatedAt: serverTimestamp()
        });
      })
    );

    // 7B. Attendee leaves with atomic decrement -> SUCCEEDS
    await assertSucceeds(
      runTransaction(attendeeDb, async tx => {
        tx.update(doc(attendeeDb, 'scenes', sceneId, 'joinRequests', attendeeUid), {
          status: 'left',
          updatedAt: serverTimestamp()
        });
        tx.update(doc(attendeeDb, 'scenes', sceneId), {
          approvedCount: 0,
          updatedAt: serverTimestamp()
        });
      })
    );

    // 7C. Counter cannot drop below 0 -> fails
    await assertFails(
      runTransaction(attendeeDb, async tx => {
        tx.update(doc(attendeeDb, 'scenes', sceneId, 'joinRequests', attendeeUid), {
          status: 'left',
          updatedAt: serverTimestamp()
        });
        tx.update(doc(attendeeDb, 'scenes', sceneId), {
          approvedCount: -1,
          updatedAt: serverTimestamp()
        });
      })
    );
  });

  test('8. Host Removes Participant: atomically decrements approvedCount', async () => {
    await seedBasicData();
    // Seed approved state (approvedCount = 1)
    await testEnv.withSecurityRulesDisabled(async context => {
      const db = context.firestore();
      await updateDoc(doc(db, 'scenes', sceneId), {
        approvedCount: 1,
        updatedAt: Timestamp.now()
      });
      await setDoc(doc(db, 'scenes', sceneId, 'joinRequests', attendeeUid), {
        requesterId: attendeeUid,
        requesterDisplayName: 'Bilal Guest',
        status: 'approved',
        decidedAt: Timestamp.now(),
        decidedBy: hostUid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    });

    const hostDb = testEnv.authenticatedContext(hostUid).firestore();
    const strangerDb = testEnv.authenticatedContext(strangerUid).firestore();

    // Stranger cannot remove participant -> fails
    await assertFails(
      runTransaction(strangerDb, async tx => {
        tx.update(doc(strangerDb, 'scenes', sceneId, 'joinRequests', attendeeUid), {
          status: 'removed',
          decidedAt: serverTimestamp(),
          decidedBy: strangerUid,
          updatedAt: serverTimestamp()
        });
        tx.update(doc(strangerDb, 'scenes', sceneId), {
          approvedCount: 0,
          lastRemovedRequesterId: attendeeUid,
          updatedAt: serverTimestamp()
        });
      })
    );

    // Host removes participant with atomic decrement -> SUCCEEDS
    await assertSucceeds(
      runTransaction(hostDb, async tx => {
        tx.update(doc(hostDb, 'scenes', sceneId, 'joinRequests', attendeeUid), {
          status: 'removed',
          decidedAt: serverTimestamp(),
          decidedBy: hostUid,
          updatedAt: serverTimestamp()
        });
        tx.update(doc(hostDb, 'scenes', sceneId), {
          approvedCount: 0,
          lastRemovedRequesterId: attendeeUid,
          updatedAt: serverTimestamp()
        });
      })
    );
  });

  test('9. Venue Privacy: Only Host and Approved Participants can read exact location', async () => {
    await seedBasicData();
    // Attendee is approved
    await testEnv.withSecurityRulesDisabled(async context => {
      const db = context.firestore();
      await updateDoc(doc(db, 'scenes', sceneId), {
        approvedCount: 1,
        updatedAt: Timestamp.now()
      });
      await setDoc(doc(db, 'scenes', sceneId, 'joinRequests', attendeeUid), {
        requesterId: attendeeUid,
        requesterDisplayName: 'Bilal Guest',
        status: 'approved',
        decidedAt: Timestamp.now(),
        decidedBy: hostUid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      // Attendee2 is only pending
      await setDoc(doc(db, 'scenes', sceneId, 'joinRequests', attendee2Uid), {
        requesterId: attendee2Uid,
        requesterDisplayName: 'Hamza Guest',
        status: 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    });

    const hostDb = testEnv.authenticatedContext(hostUid).firestore();
    const attendeeDb = testEnv.authenticatedContext(attendeeUid).firestore();
    const attendee2Db = testEnv.authenticatedContext(attendee2Uid).firestore();
    const strangerDb = testEnv.authenticatedContext(strangerUid).firestore();

    // 9A. Host can read private venue -> SUCCEEDS
    await assertSucceeds(getDoc(doc(hostDb, 'scenes', sceneId, 'privateDetails', 'location')));

    // 9B. Approved Attendee can read private venue -> SUCCEEDS
    await assertSucceeds(getDoc(doc(attendeeDb, 'scenes', sceneId, 'privateDetails', 'location')));

    // 9C. Pending Attendee2 CANNOT read private venue -> FAILS
    await assertFails(getDoc(doc(attendee2Db, 'scenes', sceneId, 'privateDetails', 'location')));

    // 9D. Stranger CANNOT read private venue -> FAILS
    await assertFails(getDoc(doc(strangerDb, 'scenes', sceneId, 'privateDetails', 'location')));
  });

  test('10. Capacity Overflow & Concurrent Race: Approval fails when event is full', async () => {
    await seedBasicData();
    // Scene capacity is 3 (1 host + max 2 guests).
    // Set approvedCount = 2 (Full!)
    await testEnv.withSecurityRulesDisabled(async context => {
      const db = context.firestore();
      await updateDoc(doc(db, 'scenes', sceneId), {
        approvedCount: 2,
        updatedAt: Timestamp.now()
      });
      // Pending request trying to get in
      await setDoc(doc(db, 'scenes', sceneId, 'joinRequests', attendeeUid), {
        requesterId: attendeeUid,
        requesterDisplayName: 'Bilal Guest',
        status: 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    });

    const hostDb = testEnv.authenticatedContext(hostUid).firestore();

    // Host attempts to approve attendee into a full event (approvedCount would become 3 > maxParticipants - 1)
    // Must be rejected by rule: approvedCount <= maxParticipants - 1
    await assertFails(
      runTransaction(hostDb, async tx => {
        tx.update(doc(hostDb, 'scenes', sceneId, 'joinRequests', attendeeUid), {
          status: 'approved',
          decidedAt: serverTimestamp(),
          decidedBy: hostUid,
          updatedAt: serverTimestamp()
        });
        tx.update(doc(hostDb, 'scenes', sceneId), {
          approvedCount: 3,
          lastApprovedRequesterId: attendeeUid,
          updatedAt: serverTimestamp()
        });
      })
    );
  });

  test('11. Cancelled and Expired Scenes: Reject all new approvals', async () => {
    await seedBasicData();
    // Mark scene as cancelled
    await testEnv.withSecurityRulesDisabled(async context => {
      const db = context.firestore();
      await updateDoc(doc(db, 'scenes', sceneId), {
        status: 'cancelled',
        updatedAt: Timestamp.now()
      });
      await setDoc(doc(db, 'scenes', sceneId, 'joinRequests', attendeeUid), {
        requesterId: attendeeUid,
        requesterDisplayName: 'Bilal Guest',
        status: 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    });

    const hostDb = testEnv.authenticatedContext(hostUid).firestore();

    // Host attempts to approve on cancelled scene -> FAILS
    await assertFails(
      runTransaction(hostDb, async tx => {
        tx.update(doc(hostDb, 'scenes', sceneId, 'joinRequests', attendeeUid), {
          status: 'approved',
          decidedAt: serverTimestamp(),
          decidedBy: hostUid,
          updatedAt: serverTimestamp()
        });
        tx.update(doc(hostDb, 'scenes', sceneId), {
          approvedCount: 1,
          lastApprovedRequesterId: attendeeUid,
          updatedAt: serverTimestamp()
        });
      })
    );
  });

  test('12. Concurrent Approvals against the final available seat: Exactly ONE succeeds, overflow is blocked', async () => {
    await seedBasicData();
    // Scene capacity is 2 (Host = 1, available guest spot = 1).
    // approvedCount is currently 0.
    await testEnv.withSecurityRulesDisabled(async context => {
      const db = context.firestore();
      await updateDoc(doc(db, 'scenes', sceneId), {
        maxParticipants: 2, // 1 host + 1 guest
        approvedCount: 0,
        updatedAt: Timestamp.now()
      });
      // Two pending requests competing for the ONLY available seat
      await setDoc(doc(db, 'scenes', sceneId, 'joinRequests', attendeeUid), {
        requesterId: attendeeUid,
        requesterDisplayName: 'Bilal Guest',
        status: 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      await setDoc(doc(db, 'scenes', sceneId, 'joinRequests', attendee2Uid), {
        requesterId: attendee2Uid,
        requesterDisplayName: 'Hamza Guest',
        status: 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    });

    const hostDb = testEnv.authenticatedContext(hostUid).firestore();

    const approveUser = (reqUid: string) =>
      runTransaction(hostDb, async tx => {
        const scSnap = await tx.get(doc(hostDb, 'scenes', sceneId));
        const currentCount = Number(scSnap.data()?.approvedCount || 0);
        tx.update(doc(hostDb, 'scenes', sceneId, 'joinRequests', reqUid), {
          status: 'approved',
          decidedAt: serverTimestamp(),
          decidedBy: hostUid,
          updatedAt: serverTimestamp()
        });
        tx.update(doc(hostDb, 'scenes', sceneId), {
          approvedCount: currentCount + 1,
          lastApprovedRequesterId: reqUid,
          updatedAt: serverTimestamp()
        });
      });

    // Fire both transactions simultaneously
    const results = await Promise.allSettled([
      approveUser(attendeeUid),
      approveUser(attendee2Uid)
    ]);

    const successes = results.filter(r => r.status === 'fulfilled');
    const failures = results.filter(r => r.status === 'rejected');

    // Exactly one transaction succeeded, and the other was rejected due to capacity overflow
    assert.strictEqual(successes.length, 1, 'Exactly one approval must succeed');
    assert.strictEqual(failures.length, 1, 'Exactly one approval must be rejected by rules/transaction');

    // Verify scene document state
    const finalSceneSnap = await getDoc(doc(hostDb, 'scenes', sceneId));
    assert.strictEqual(finalSceneSnap.data()?.approvedCount, 1, 'Final approvedCount must be exactly 1');
  });
});

