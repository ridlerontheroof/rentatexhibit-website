import { readFile, readdir, writeFile, mkdtemp, rm } from "node:fs/promises";
import { spawn, execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
const root=resolve(fileURLToPath(new URL("..",import.meta.url))), apiOrigin="http://127.0.0.1:4411";
const temp=await mkdtemp(resolve(tmpdir(),"kit-production-smoke-"));
const baseConfig=JSON.parse(await readFile(resolve(root,"config/example-property-config.json"),"utf8"));
const terminal=JSON.parse(await readFile(resolve(root,"config/release-environment-manifest.json"),"utf8"));
const releaseContent=JSON.parse(await readFile(resolve(root,"config/release-content-manifest.json"),"utf8"));
baseConfig.property.name="Production Smoke Property"; baseConfig.property.slug="production-smoke-property"; baseConfig.identity.canonicalOrigin="https://production-smoke.example.invalid"; baseConfig.environmentManifestPath="terminal-manifest.json";
baseConfig.contentManifestPath="content-manifest.json"; releaseContent.propertySlug=baseConfig.property.slug;
terminal.propertySlug=baseConfig.property.slug;
const configPath=resolve(temp,"property-config.json");
await writeFile(configPath,JSON.stringify(baseConfig,null,2)); await writeFile(resolve(temp,"terminal-manifest.json"),JSON.stringify(terminal,null,2));
await writeFile(resolve(temp,"content-manifest.json"),JSON.stringify(releaseContent,null,2));
const pending={...terminal,reviewStatus:"DRAFT"}; delete pending.reviewedBy; delete pending.reviewedAt; pending.entries=pending.entries.map(e=>({...e,approval:"PENDING",status:"NOT_CONFIGURED",approvedBy:undefined,approvedAt:undefined,scopeVerified:e.classification==="account-secret-link"?false:e.scopeVerified}));
await writeFile(resolve(temp,"pending-manifest.json"),JSON.stringify(pending,null,2));
await writeFile(resolve(temp,"pending-config.json"),JSON.stringify({...baseConfig,environmentManifestPath:"pending-manifest.json"},null,2));
async function expectStartupFailure(env,label){
  const child=spawn("pnpm",["--filter","@highland/property-api","start"],{cwd:root,env:{...process.env,NODE_ENV:"production",PORT:"4499",...env},stdio:"ignore"});
  const code=await Promise.race([new Promise(r=>child.once("exit",r)),new Promise(r=>setTimeout(()=>r("timeout"),5000))]);
  if(code==="timeout"){child.kill("SIGKILL");throw new Error(`${label} unexpectedly remained running`)} if(code===0)throw new Error(`${label} unexpectedly succeeded`);
}
await expectStartupFailure({PROPERTY_CONFIG_PATH:""},"missing PROPERTY_CONFIG_PATH");
await expectStartupFailure({PROPERTY_CONFIG_PATH:resolve(temp,"pending-config.json")},"pending manifest");
await expectStartupFailure({PROPERTY_CONFIG_PATH:configPath,DATABASE_URL:""},"missing DATABASE_URL");
await expectStartupFailure({PROPERTY_CONFIG_PATH:configPath,DATABASE_URL:"postgresql://smoke.invalid/property",INDEXNOW_KEY:""},"missing INDEXNOW_KEY");
execFileSync("pnpm",["--filter","@highland/property-web","build"],{cwd:root,env:{...process.env,PROPERTY_CONFIG_PATH:configPath,VITE_API_URL:apiOrigin},stdio:"inherit"});
const assets=await readdir(resolve(root,"web/dist/public/assets")); const js=await readFile(resolve(root,"web/dist/public/assets",assets.find(x=>x.endsWith(".js"))),"utf8"); if(!js.includes(apiOrigin))throw new Error("production bundle lacks VITE_API_URL");
const api=spawn("pnpm",["--filter","@highland/property-api","start"],{cwd:root,env:{...process.env,NODE_ENV:"production",PROPERTY_CONFIG_PATH:configPath,DATABASE_URL:"postgresql://smoke.invalid/property",INDEXNOW_KEY:"smoke-only",SESSION_SECRET:"smoke-only",VITE_API_URL:apiOrigin,PORT:"4411"},detached:true,stdio:"ignore"});
const web=spawn("node",["web/server/index.mjs"],{cwd:root,env:{...process.env,NODE_ENV:"production",PORT:"4410"},detached:true,stdio:"ignore"});
const stop=()=>{for(const c of [api,web])try{process.kill(-c.pid,"SIGTERM")}catch{}};
const wait=async u=>{for(let i=0;i<80;i++){try{const r=await fetch(u);if(r.status<500)return r}catch{}await new Promise(r=>setTimeout(r,100))}throw new Error(`timeout ${u}`)};
try{
  if(!(await wait("http://127.0.0.1:4410/")).ok)throw new Error("static root failed");
  if((await fetch("http://127.0.0.1:4410/api/config/public")).status!==404)throw new Error("static server swallowed /api");
  const response=await wait(apiOrigin+"/api/config/public"), selected=await response.json(); if(selected.property.slug!=="production-smoke-property")throw new Error("API did not load selected property");
  for(const path of ["/api/healthz","/api/content/faqs"])if(!(await wait(apiOrigin+path)).ok)throw new Error(`API failed ${path}`);
  process.stdout.write("production smoke passed: explicit terminal property selected; negative startup contracts enforced\n");
}finally{stop();await rm(temp,{recursive:true,force:true})}