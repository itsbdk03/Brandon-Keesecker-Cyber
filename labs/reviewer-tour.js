/* Guided reviewer tours for the seven existing labs. All instructions use synthetic demo data. */
(()=>{'use strict';
const isAssurance=/\/assuranceflow\.html$/i.test(location.pathname);
const labTours={
controls:[
['#controlList','Inspect the control inventory','Choose a fictional NIST control and review its owner, status, implementation narrative, and evidence references.'],
['#controlForm','Edit implementation evidence','Update the fictional control narrative or evidence reference and save it. The workbench stores only your local browser sample.'],
['#controlInsights','Evaluate documentation quality','Review missing evidence, incomplete statements, and prioritized follow-ups. These are not official FedRAMP assessments.'],
['#controlBrief','Export an audit-style brief','Download a Markdown report that explains the sample inventory, gaps, and assessment limitations.']],
hunt:[
['#huntScan','Run detection heuristics','The synthetic events model password guessing, a later login, process activity, and an outbound connection. Select Run detections.'],
['#huntFindingList','Review detection findings','Inspect the rule, severity, timestamp, and analyst detail. A rule match is not a confirmed security incident.'],
['#huntCorrelation','Follow a source-aware timeline','Correlations require the same identity AND source IP for the initial authentication sequence. Later activity is contextual, not proven causal.'],
['#huntBrief','Export the analyst narrative','Download a case summary and see how the tool distinguishes observations from conclusions.']],
cloud:[
['#cloudScenario','Choose a cloud scenario','Switch between the fictional architecture focus labels; none is a FedRAMP authorization or DoD impact-level determination.'],
['#cloudSwitches','Apply defense-in-depth safeguards','Enable controls such as MFA, segmentation, least privilege, logging, and encryption to explore architecture tradeoffs.'],
['#cloudInsights','Inspect verification needs','Review which safeguards remain disabled and what independent evidence would be needed for a real assessment.'],
['#cloudBrief','Download an architecture review','Export a fictional assessment memo detailing the safeguards and limitations.']],
risk:[
['#riskForm','Add a modeled risk','Give a fictional risk a description, owner, likelihood, and impact.'],
['#riskHeat','Use the interactive risk matrix','Click an intersection to filter your sample risks by likelihood and impact.'],
['#riskTable','Review residual exposure','Adjust treatment maturity and inspect the illustrative residual risk calculation.'],
['#riskBrief','Export a risk committee memo','Generate a prioritized briefing, without presenting this sample formula as an official risk standard.']],
config:[
['#configPreset','Compare two AWS samples','Select Exposed environment, then Hardened environment, to see how the same deterministic checks respond to changed JSON.'],
['#configUnknownList','Examine assessment coverage','Inspect unassessed properties and omitted JSON sections. Missing inputs must never be mistaken for passing controls.'],
['#configDeltaList','Verify the remediation comparison','See which prior findings were resolved, introduced, persisted, or could not be reverified.'],
['#configDeltaExport','Download a change brief','Export a human-readable before-and-after comparison. This is not a live AWS account scan.']],
path:[
['#pathPreset','Explore a fictional threat scenario','Choose the exposed or hardened graph, then review the modeled routes to protected assets.'],
['#pathDiagram','Trace the attack graph','The diagram shows only the nodes and transitions included in this tabletop model.'],
['#pathControlsList','Interrupt an attack route','Enable one or more defensive safeguards, and see which modeled transitions disappear.'],
['#pathNextActions','Review defensive priorities','Observe which single changes reduce reachability most under the demo assumptions.']]
};
const assurance=[
['#rows','Choose a control record','Select one of the eight fictional security controls. The documentation quality score is a local heuristic only.'],
['#form','Review documentation completeness','Modify the owner, narrative, evidence references, status, or next action and apply the change.'],
['#priorities','Prioritize gaps','See which fictional records need better ownership, implementation descriptions, or evidence references.'],
['#exportReport','Export a reviewer report','Download an illustrative report or partial control-implementation fragment. These are not official OSCAL SSP validations.']
];
const tourSteps=()=>isAssurance?assurance:(labTours[document.querySelector('.lab-nav.active[data-panel]')?.dataset.panel]||labTours.controls);
let index=0,open=false;
const shell=document.createElement('section');shell.className='bk-reviewer-tour';shell.hidden=true;shell.setAttribute('role','region');shell.setAttribute('aria-label','Guided lab walkthrough');
const launcher=document.createElement('button');launcher.type='button';launcher.className='bk-reviewer-launch';launcher.textContent='✧ Guided walkthrough';launcher.setAttribute('aria-label','Open guided walkthrough for this lab');
const header=document.createElement('div');header.className='bk-tour-top';
const overline=document.createElement('span');overline.className='bk-tour-eyebrow';overline.textContent='REVIEWER MODE · SYNTHETIC DEMO';
const close=document.createElement('button');close.type='button';close.className='bk-tour-close';close.textContent='×';close.setAttribute('aria-label','Close walkthrough');header.append(overline,close);
const count=document.createElement('span');count.className='bk-tour-count';
const title=document.createElement('h3');const desc=document.createElement('p');
const progress=document.createElement('div');progress.className='bk-tour-progress';const fill=document.createElement('span');progress.append(fill);
const footer=document.createElement('div');footer.className='bk-tour-buttons';
const prev=document.createElement('button');prev.type='button';prev.textContent='← Previous';
const next=document.createElement('button');next.type='button';next.textContent='Next →';next.className='bk-tour-primary';
footer.append(prev,next);shell.append(header,count,title,desc,progress,footer);
document.body.append(launcher,shell);
let target=null;
function clear(){if(target){target.classList.remove('bk-reviewer-highlight');target=null}}
function render(){if(!open)return;clear();const steps=tourSteps();const item=steps[index]||steps[0];count.textContent='STEP '+(index+1)+' OF '+steps.length;title.textContent=item[1];desc.textContent=item[2];fill.style.width=(100*(index+1)/steps.length)+'%';prev.disabled=index===0;next.textContent=index===steps.length-1?'Finish ✓':'Next →';target=document.querySelector(item[0]);if(target){target.classList.add('bk-reviewer-highlight');target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'})}}
function show(){index=0;open=true;shell.hidden=false;launcher.setAttribute('aria-expanded','true');render();close.focus({preventScroll:true})}
function hide(){clear();open=false;shell.hidden=true;launcher.setAttribute('aria-expanded','false');launcher.focus({preventScroll:true})}
launcher.addEventListener('click',()=>open?hide():show());close.addEventListener('click',hide);prev.addEventListener('click',()=>{if(index>0){index--;render()}});next.addEventListener('click',()=>{if(index>=tourSteps().length-1)hide();else{index++;render()}});
document.addEventListener('keydown',e=>{if(open&&e.key==='Escape')hide()});
if(!isAssurance){document.querySelectorAll('.lab-nav[data-panel]').forEach(b=>b.addEventListener('click',()=>{if(open){index=0;requestAnimationFrame(render)}}));window.addEventListener('hashchange',()=>{if(open){index=0;requestAnimationFrame(render)}})}
})();