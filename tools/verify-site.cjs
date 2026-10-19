// Strict static website checks, no network and no new dependencies.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const exists=p=>fs.existsSync(path.join(root,p));
const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
const lab=fs.readFileSync(path.join(root,'labs/index.html'),'utf8');
const scripts=[...lab.matchAll(/<script\s+src="([^"]+)"\s+defer><\/script>/g)].map(m=>m[1]);
assert(scripts.includes('engineering-model.js')&&scripts.includes('engineering-lens.js'),'Engineering Lens must load for integrated labs');
assert(scripts.includes('command-model.js')&&scripts.includes('command-menu.js'),'Unified lab command palette must load');
assert(scripts.indexOf('command-model.js')<scripts.indexOf('command-menu.js'),'Command model must initialize before command menu');
assert(lab.includes('command-menu.css'),'Unified navigation must load responsive styles');
assert(scripts.includes('exercise-model.js')&&scripts.includes('exercise-mode.js'),'Evidence Check scripts must load');
assert(scripts.indexOf('exercise-model.js')<scripts.indexOf('exercise-mode.js'),'Exercise model must load before the interactive UI');
assert(lab.includes('exercise-mode.css'),'Evidence Check responsive styles are required');
assert(lab.includes('engineering-lens.css'),'Engineering Lens requires responsive styles');
assert(scripts.includes('report-engine.js')&&scripts.includes('report-studio.js'),'Report studio must be loaded in all integrated labs');
assert(scripts.indexOf('report-engine.js')<scripts.indexOf('report-studio.js'),'Report engine must load before UI');
assert(scripts.includes('reviewer-tour.js'),'Integrated labs must load the guided review tour');
assert(lab.includes('reviewer-tour.css'),'Integrated labs must style the guided review tour');
const assurance=fs.readFileSync(path.join(root,'labs/assuranceflow.html'),'utf8');
assert(assurance.includes('reviewer-tour.js')&&assurance.includes('reviewer-tour.css'),'AssuranceFlow must load guided review tour');
assert(assurance.includes('report-engine.js')&&assurance.includes('report-studio.js'),'AssuranceFlow must load report studio');
assert(assurance.includes('engineering-model.js')&&assurance.includes('engineering-lens.js'),'AssuranceFlow must load engineering architecture');
assert(assurance.includes('exercise-model.js')&&assurance.includes('exercise-mode.js'),'AssuranceFlow must load evidence exercises');
assert(assurance.includes('command-model.js')&&assurance.includes('command-menu.js')&&assurance.includes('command-menu.css'),'AssuranceFlow must share the same command navigation');
const methodology=fs.readFileSync(path.join(root,'labs/methodology.html'),'utf8');
for(const id of ['controltrace','signalhunt','cloudguard','riskmatrix','configlens','attackpath','assuranceflow'])assert(methodology.includes('id="'+id+'"'),'Engineering notes are missing '+id);
assert(methodology.includes('methodology-enhancements.js'),'Architecture renderer missing from case study page');
assert(scripts.includes('configlens-engine.js')&&scripts.indexOf('configlens-engine.js')<scripts.indexOf('configlens.js'),'ConfigLens engine must load before UI');
for(const s of scripts)assert(exists('labs/'+s),`Missing lab script ${s}`);
for(const f of ['index.html','labs/index.html','labs/assuranceflow.html','incidentdesk/index.html','incidentdesk/model.js','incidentdesk/app.js','incidentdesk/schema.sql','labs/assuranceflow-engine.js','labs/reviewer-tour.css','labs/reviewer-tour.js','labs/report-engine.js','labs/report-studio.js','labs/engineering-model.js','labs/engineering-lens.js','labs/engineering-lens.css','labs/methodology-enhancements.js','labs/exercise-model.js','labs/exercise-mode.js','labs/exercise-mode.css','labs/command-model.js','labs/command-menu.js','labs/command-menu.css','labs/methodology.html','labs/samples/events-demo.csv','labs/samples/configlens-exposed.json','labs/samples/configlens-hardened.json'])assert(exists(f),`Missing ${f}`);
for(const ref of ['#controls','#hunt','#cloud','#risk','#config','#path','assuranceflow.html'])assert(home.includes(ref),`Portfolio missing lab route ${ref}`);
const labRoutes=[...home.matchAll(/url:'((?:labs\/(?:index\.html#(?:controls|hunt|cloud|risk|config|path)|assuranceflow\.html)|incidentdesk\/index\.html))'/g)].map(m=>m[1]);
assert.equal(labRoutes.length,8,'Seven existing labs plus IncidentDesk are expected');
assert.equal(new Set(labRoutes).size,8,'Portfolio project links must be unique');
const githubProfile='https://github.com/itsbdk03';
assert(home.includes(githubProfile),'GitHub profile link missing');
const publicLinkedin='https://www.linkedin.com/in/brandon-keesecker-i-ccsk-aws-ccp-24463b242/';
assert(home.includes(publicLinkedin),'LinkedIn profile URL missing');
for(const f of ['labs/samples/configlens-exposed.json','labs/samples/configlens-hardened.json'])JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));

// Employer-facing navigation and public architecture asset acceptance.
const gallery=fs.readFileSync(path.join(root,'architectures/index.html'),'utf8');
const slugs=['fedramp-moderate','fedramp-high','dod-il4','dod-il5','cmmc-l2','hitrust','hipaa','soc2'];
for(const slug of slugs){
  assert(gallery.includes('"id":"'+slug+'"'),'Missing architecture gallery data for '+slug);
  const poster=path.join(root,'architectures/posters',slug+'.webp');
  assert(fs.existsSync(poster),'Missing original illustrated poster: '+slug);
  assert(fs.statSync(poster).size>80000,'Architecture poster unexpectedly small: '+slug);
  assert(home.includes('architectures/index.html#'+slug),'Missing homepage architecture link '+slug);
}
for(const ref of [
  'https://itsbdk03.github.io/Brandon-Keesecker-Cyber/',
  'https://itsbdk03.github.io/Brandon-Keesecker-Cyber/docs/images/portfolio-projects.webp'
])assert(home.includes(ref),'Portfolio SEO metadata missing '+ref);
for(const title of ['ControlTrace','SignalHunt','CloudGuard','RiskMatrix','ConfigLens','AttackPath','AssuranceFlow','IncidentDesk'])
  assert(home.includes("title:'"+title),'Missing public project record for '+title);
assert(home.includes('View source ↗')&&home.includes('projectSourceFiles'),'Employer-facing source links not configured');
assert(gallery.includes('id="posterMode"')&&gallery.includes('id="vectorMode"')&&gallery.includes('id="openPoster"'),'Architecture poster/vector controls missing');
assert(gallery.includes('class="skip-link"')&&gallery.includes('aria-labelledby','tab-'),'Architecture navigation accessibility requirements missing');
assert(exists('tools/architecture-browser.py'),'Architecture Playwright regression script missing');

console.log(`Verified ${scripts.length} lab scripts, 8 project routes, 8 illustrated architecture posters, LinkedIn and example data.`);
