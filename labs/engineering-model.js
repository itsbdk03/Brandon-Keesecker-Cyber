/* Architecture dossiers for the existing seven security workbenches.
   Public-safe, versioned content; not claims of formal assessment or production deployment. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.BKEngineeringModel=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const entries={
    controls:{
      name:'ControlTrace',area:'CONTROL ASSURANCE / DOCUMENTATION',
      question:'What separates a control marked complete from a control whose implementation can actually be reviewed?',
      inputs:'Nine fictional control records with owner, status, narrative, evidence references, and a next action.',
      stages:[
        ['01 · INTAKE','Fictional control inventory','Curated 800-53-style identifiers and narratives, intentionally not a full impact-level baseline.'],
        ['02 · TRACE','Evidence mapping','Associate a record with sample evidence identifiers and identify missing implementation support.'],
        ['03 · REVIEW','Documentation completeness','Surface incomplete records and inconsistencies between self-reported status and supporting text.'],
        ['04 · EXPLAIN','Remediation narrative','Prioritize follow-up work and export a reviewer-friendly brief.']
      ],
      decisions:['Retain explicit gaps rather than inferring compliance from a status label.','Use local browser storage for educational records; no third-party account or confidential evidence.','Treat framework/impact-level selectors as context only, not authoritative baseline applicability.'],
      limits:['Self-reported status and evidence references are fictional, not independently verified.','A complete-looking narrative does not establish technical control effectiveness.'],
      verification:'Browser route, editor, exports and basic integration checks. No dedicated production assessment engine.',
      files:['labs/labs.js','labs/enhancements.js','labs/report-studio.js'],section:'controltrace'
    },
    hunt:{
      name:'SignalHunt',area:'DETECTION ENGINEERING / ANALYST TRIAGE',
      question:'How do separate log observations become a defensible investigation lead without assuming compromise?',
      inputs:'Browser-imported or synthetic CSV/JSON events with time, identity, source IP, process and destination context.',
      stages:[
        ['01 · INGEST','Bounded event import','Parse a small, schema-limited local dataset and validate event timestamps.'],
        ['02 · DETECT','Deterministic heuristics','Identify authentication bursts, login-after-failure, scripting processes, and watchlisted destinations.'],
        ['03 · CORRELATE','Identity + source match','Require the same account and IP for the initial failure-to-success authentication sequence.'],
        ['04 · TRIAGE','Explain rather than assert','Present timelines and response questions, then export findings and a case narrative.']
      ],
      decisions:['Require matching identity and source IP to reduce a cross-source false-positive mode.','Describe later endpoint/network activity as temporal context, not proven causal linkage.','Use reserved documentation IP ranges in the fictional sample.'],
      limits:['Rules and technique labels are triage heuristics, not proof of maliciousness.','No enterprise SIEM, threat-intelligence feed, agent or live log collection.'],
      verification:'Dedicated source-aware correlation regression tests plus browser investigation and export checks.',
      files:['labs/signalhunt-correlation.js','labs/tests/signalhunt-correlation.test.cjs','labs/labs.js'],section:'signalhunt'
    },
    cloud:{
      name:'CloudGuard',area:'CLOUD ARCHITECTURE / DEFENSE IN DEPTH',
      question:'How do identity, network, encryption and monitoring safeguards affect a modeled cloud architecture?',
      inputs:'Six local safeguard toggles and illustrative architecture-context labels.',
      stages:[
        ['01 · FRAME','Select design context','Explore the synthetic reference environment and proposed security boundary.'],
        ['02 · MODEL','Toggle safeguards','Apply MFA, least privilege, limited ingress, encryption, telemetry and segmentation.'],
        ['03 · VISUALIZE','Architectural posture','Update the diagram and show exactly which model assumptions changed.'],
        ['04 · VALIDATE NEXT','Evidence requests','Describe what settings and operating records would be needed to confirm real controls.']
      ],
      decisions:['Make every safeguard independently adjustable for a clear demonstration of defense in depth.','Describe weighted “improvement” as model points, never verified risk reduction.','Use text recommendations alongside diagrams for accessibility and audit discussion.'],
      limits:['Toggles are hypothetical and do not change real infrastructure.','No official FedRAMP/DoD boundary or authorization assessment is performed.'],
      verification:'Chromium interaction and report-download smoke tests; no cloud deployment or compliance validation.',
      files:['labs/labs.js','labs/enhancements.js','labs/report-studio.js'],section:'cloudguard'
    },
    risk:{
      name:'RiskMatrix',area:'RISK GOVERNANCE / PRIORITIZATION',
      question:'How do decision-makers trace a change in estimated exposure back to the assumptions behind it?',
      inputs:'Fictional scenario names, ownership, likelihood, impact and mitigation-maturity sliders.',
      stages:[
        ['01 · RECORD','Define example risk','Capture likelihood, impact, owner and a fictional risk event.'],
        ['02 · CALCULATE','Apply a disclosed model','Compute an illustrative residual using likelihood × impact × (1 − 0.15 × maturity).'],
        ['03 · COMPARE','Five-by-five visualization','Update scenario severity, heatmap, filters and ordering.'],
        ['04 · DECIDE','Treatment memo','Export priorities with questions about ownership, acceptance and verification.']
      ],
      decisions:['Expose the residual scoring formula rather than presenting unexplained percentages.','Keep raw inputs editable so assumptions can be challenged.','Distinguish prioritization aid from a formal organizational risk appetite methodology.'],
      limits:['The example formula is not NIST-prescribed and does not estimate real loss probability.','No risk acceptance workflow, governance approval or integration with organizational systems.'],
      verification:'Chromium editor, dashboard, and export smoke tests; illustrative calculation only.',
      files:['labs/labs.js','labs/enhancements.js','labs/report-studio.js'],section:'riskmatrix'
    },
    config:{
      name:'ConfigLens',area:'AWS CONFIGURATION / EXPLAINABLE REVIEW',
      question:'When a finding disappears, was the configuration fixed—or did the evidence simply go missing?',
      inputs:'Deliberately exposed or hardened sample JSON summaries, or a user-supplied local JSON sample.',
      stages:[
        ['01 · PARSE','Local JSON snapshot','Parse narrow summaries for account, S3, IAM, security groups, CloudTrail, RDS and EBS.'],
        ['02 · ASSESS','12 deterministic rules','Evaluate only supported fields and report failed properties with remediation references.'],
        ['03 · REVERIFY','Evidence-aware delta','Compare a baseline and updated snapshot; distinguish resolved, persistent and unverified findings.'],
        ['04 · EXPORT','Analyst review evidence','Produce a change brief, SARIF findings and a print-ready overview.']
      ],
      decisions:['Unknown fields never count as passing controls.','A vanished failing property is unverified until the same check can be reevaluated.','Associate flagged properties with applicable public AWS guidance rather than asserting compliance.'],
      limits:['This is not a live AWS scan, Terraform/HCL parser, IAM policy simulator, or FedRAMP assessment.','Checks apply only to a deliberately simplified JSON schema.'],
      verification:'Dedicated rule/delta unit tests plus desktop and narrow touch-viewport Chromium reviews.',
      files:['labs/configlens-engine.js','labs/tests/configlens.test.cjs','labs/configlens.js'],section:'configlens'
    },
    path:{
      name:'AttackPath',area:'THREAT MODELING / DEFENSIVE GRAPH',
      question:'Which assumed defensive intervention interrupts the most modeled routes to protected assets?',
      inputs:'A fictional directed network graph, scenario presets and configurable safeguard states.',
      stages:[
        ['01 · DEFINE','Synthetic topology','Represent entry points, trust transitions and protected targets as directed graph nodes and edges.'],
        ['02 · TRAVERSE','Enumerate reachable routes','Evaluate target reachability under explicitly modeled weakness flags.'],
        ['03 · INTERRUPT','Counterfactual safeguards','Apply a defensive measure and calculate which modeled transitions become unavailable.'],
        ['04 · EXPLAIN','Prioritized interventions','Rank candidate safeguards and export the assumed routes and changes.']
      ],
      decisions:['Use repeatable traversal instead of a hand-animated success graphic.','Show what each safeguard interrupts and avoid treating route count as exploit probability.','Preserve an explicit boundary around omitted paths and unmodeled attacker behavior.'],
      limits:['A closed modeled path does not prove a real system is secure.','No exploit execution, penetration testing, live asset inventory or likelihood prediction.'],
      verification:'Standalone graph engine unit tests plus automated browser scenario and report checks.',
      files:['labs/attackpath-engine.js','labs/tests/attackpath.test.cjs','labs/attackpath.js'],section:'attackpath'
    },
    assurance:{
      name:'AssuranceFlow',area:'SECURITY DOCUMENTATION / CONTROL REVIEW',
      question:'How can reviewers find missing ownership, narratives and evidence before a control assessment?',
      inputs:'Eight fictional control statements, evidence references, status, owner and remaining gap.',
      stages:[
        ['01 · IMPORT','Documentation subset','Load the curated example or a narrow OSCAL SSP implemented-requirements subset.'],
        ['02 · NORMALIZE','Bounded, typed records','Normalize identifiers and constrain input sizes without rendering imported HTML.'],
        ['03 · ASSESS','Explainable completeness','Apply a disclosed rubric for owner, narrative length, evidence references and claimed status.'],
        ['04 · HANDOFF','Review workpapers','Export reviewer Markdown, local JSON and an explicitly partial OSCAL-oriented fragment.']
      ],
      decisions:['Separate documentation completeness from actual control effectiveness.','Make unknown imported ownership and evidence fields explicit, not inferred.','Do not claim a partial control implementation export is a valid OSCAL SSP.'],
      limits:['The tool is not an OSCAL schema validator, FedRAMP review or security authorization workflow.','All baseline labels and evidence records are illustrative.'],
      verification:'Standalone normalization/import/scoring tests and Chromium editor/export checks.',
      files:['labs/assuranceflow-engine.js','labs/tests/assuranceflow.test.cjs','labs/assuranceflow.html'],section:'assuranceflow'
    }
  };
  const keys=Object.freeze(Object.keys(entries));
  function get(key){return entries[key]||null}
  function validate(){
    if(keys.length!==7)throw Error('Expected the seven existing projects.');
    for(const key of keys){
      const e=entries[key];
      if(!e.name||!e.question||e.stages.length!==4||e.files.length<2||!e.section)throw Error('Incomplete dossier: '+key);
      if(e.limits.length<2||e.decisions.length<2)throw Error('No trust boundaries in '+key);
      if(e.files.some(p=>!/^labs\/[a-z0-9/.:-]+$/.test(p)))throw Error('Unexpected source reference');
    }
    return true;
  }
  return Object.freeze({entries,keys,get,validate});
});
