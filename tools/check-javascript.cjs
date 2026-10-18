// Syntax-check all shipped JavaScript without third-party packages.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(f=>f.isDirectory()?walk(path.join(dir,f.name)):(f.name.endsWith('.js')||f.name.endsWith('.cjs'))?[path.join(dir,f.name)]:[])}
const files=[...walk(path.join(root,'labs')),...walk(path.join(root,'tools'))];
for(const file of files){const r=cp.spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(r.status!==0){process.stderr.write(r.stderr);process.exitCode=1;}}
console.log(`Syntax checked ${files.length} JavaScript files`);
