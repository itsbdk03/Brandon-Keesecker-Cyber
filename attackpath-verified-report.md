# AttackPath — Defensive Threat Modeling Report
Generated (UTC): 2026-10-18T20:03:55.442Z

## Exercise boundary
Deterministic fictional attack graph for learning. Not a penetration test, proof of compromise, risk quantification, or authorization assessment. No network probing or exploit code is present.

Reachable protected targets: 2 of 3
Distinct modeled target-reaching paths: 5
Interrupted edges: 2

## Target reachability
- Data Store: REACHABLE
- Backup Vault: REACHABLE
- Outbound Channel: NOT REACHED

## Modeled attack routes
1. External Actor -> Public Web App -> App Workload -> Data Store
2. External Actor -> Public Web App -> App Workload -> Backup Vault
3. External Actor -> Identity Gateway -> Admin Session -> App Workload -> Data Store
4. External Actor -> Identity Gateway -> Admin Session -> App Workload -> Backup Vault
5. External Actor -> Identity Gateway -> Admin Session -> Backup Vault

## Safeguard state
- Patch vulnerable public application: Not applied
- Revoke compromised credentials: Not applied
- Enforce phishing-resistant MFA: Not applied
- Constrain privileged access: Not applied
- Segment application and database: Not applied
- Isolate backup management: Not applied
- Restrict and monitor outbound traffic: Applied

## Prioritized simulated interventions
1. Isolate backup management: blocks 3 existing route(s) and reduces reachable targets by 1. Separating backup access from application and administrative sessions reduces modeled backup exposure.
2. Segment application and database: blocks 2 existing route(s) and reduces reachable targets by 1. Segmentation blocks the modeled application-to-database route.
3. Enforce phishing-resistant MFA: blocks 3 existing route(s) and reduces reachable targets by 0. Strong authentication can interrupt credential-only progression to a privileged session.
4. Revoke compromised credentials: blocks 3 existing route(s) and reduces reachable targets by 0. Credential rotation and session invalidation interrupt the modeled attacker foothold into the identity gateway.
5. Constrain privileged access: blocks 2 existing route(s) and reduces reachable targets by 0. Least privilege removes the modeled administrator-to-workload progression.
6. Patch vulnerable public application: blocks 2 existing route(s) and reduces reachable targets by 0. Hardening the public-facing application removes the modeled route from the web tier to the workload.

## Session changes
- 2026-10-18T20:03:55.042Z: Simulated prioritized safeguard — Restrict and monitor outbound traffic

## Limits
The graph intentionally covers eight example assets and seven modeled weaknesses. It does not estimate exploit likelihood, compensating controls, real cloud inheritance, actual privileges, or attack techniques outside this small scenario.