const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-BQrg3B7Q.js","assets/markdown-iRzT9WLe.js","assets/react-vendor-dxtGLVVn.js","assets/pdf-DpamXFWf.js","assets/supabase-03S03Glk.js","assets/state-Bu7ntKXg.js","assets/icons-D58Um3gU.js","assets/index-Y8TWIq_p.css"])))=>i.map(i=>d[i]);
import{j as o}from"./markdown-iRzT9WLe.js";import{i as W,r as $}from"./react-vendor-dxtGLVVn.js";import{R as Y,D as K,A as Q,K as V,a as q,N as J,S as X}from"./ShareRetake-CjUhSwq0.js";import{_ as Z}from"./pdf-DpamXFWf.js";import{s as ee,d as j}from"./assessmentEngine-Bu2Dppiq.js";import{g as H}from"./cpiReportRenderer-B6BDBhUF.js";import{k as te}from"./index-BQrg3B7Q.js";import{T as oe,a3 as ie}from"./icons-D58Um3gU.js";const se="/api";async function _(a,e,i){try{const s=await te(`${se}/reports/generate`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({templateId:a,format:e,context:i})});if(!s.ok)throw new Error("Failed to generate report");return await s.json()}catch(s){return{success:!1,error:s.message}}}const O={CPI:"#C108AB",PRISM:"#C108AB",SPARK:"#0D9488",LEAP:"#6366F1",QUEST:"#3B82F6",DRIVE:"#F59E0B",COACH:"#10B981",IMPACT:"#F43F5E",FORGE:"#8B5CF6",BRIDGE:"#EC4899",MOSAIC:"#14B8A6"},z={CPI:"China Leadership Pipeline Index",PRISM:"PRISM Leadership Diagnostic",SPARK:"SPARK AI Readiness Diagnostic",LEAP:"LEAP — Learning & Execution Potential",QUEST:"QUEST — Questioning & Inquiry Skills",IMPACT:"IMPACT — Influence & Executive Presence",FORGE:"FORGE — Performance & Resilience",DRIVE:"DRIVE — Execution & Delivery Capability",COACH:"COACH — Coaching & Leadership Development",BRIDGE:"BRIDGE — Cross-Border Leadership",MOSAIC:"MOSAIC — Cultural Agility"};async function T(a,e,i){const s=a.toUpperCase(),n={persist:i?.persist,userId:i?.userId},r=await ee(s,e,n);if(!r.ok)throw new Error(`[reportPipeline] Akira scoring failed for ${s}: ${r.error}`);const{meta:m,result:l}=r,t=l,g={},y={};for(const p of m.dimensions)g[p.id]=t.dimension_scores?.[p.id]??50,y[p.id]=p.name;const h=typeof t.composite?.score=="number"?t.composite.score:60,c=typeof t.composite?.band=="string"&&t.composite.band?t.composite.band:h>=80?"Elite":h>=65?"Advanced":h>=50?"Established":"Developing",x=t.archetype?.name||"Balanced Leader",d=t.archetype?.description||t.archetype?.core_strength,f=Array.isArray(t.archetype?.strengths)?t.archetype.strengths:void 0,S=Array.isArray(t.archetype?.development)?t.archetype.development:void 0,b=[],v=[],L=[];if(Array.isArray(t.development_priorities))for(const p of t.development_priorities)p&&typeof p.priority=="number"&&(b.push({priority:p.priority,dimension:String(p.dimension||"Development"),action:String(p.action||p.recommendation||"Targeted development practice"),timeline:String(p.timeline||"90 days")}),typeof p.dimension=="string"&&p.priority<=2&&L.push({title:String(p.dimension),text:String(p.action||p.recommendation||"")}));const G=Object.entries(g).sort((p,k)=>k[1]-p[1]);for(const[p,k]of G.slice(0,3))k>=70&&v.push({title:y[p]||p,text:`A core strength at ${k}/100 — leverage this as a leadership multiplier.`});const P={instrumentKey:s,compositeScore:h,tierLabel:c,archetype:x,archetypeDescription:d,archetypeTagline:m.tagline,archetypeStrengths:f,archetypeDevelopment:S,dimensionScores:g,dimensionNames:y,crossBorderScore:typeof t.cross_border_score=="number"?t.cross_border_score:void 0,strengths:v.length?v:void 0,gaps:L.length?L:void 0,development_actions:b.length?b:void 0,generatedAt:new Date,userId:i?.userId};return r.ok&&r.persisted_id&&(P.id=r.persisted_id),P}async function B(a,e,i){const s=a.toUpperCase(),n=i?.accent||O[s]||"#C108AB",r=i?.generatedAt||new Date,m=z[s]||`${s} Assessment`;if(s==="CPI"){const d={name:"Assessment Participant",date:r.toISOString().split("T")[0],compositeScore:e.compositeScore,tierLabel:e.tierLabel,archetype:e.archetype,archetypeTagline:e.archetypeTagline,archetypeDescription:e.archetypeDescription,archetypeStrengths:e.archetypeStrengths,archetypeDevelopment:e.archetypeDevelopment,dimensionScores:e.dimensionScores,dimensionNames:e.dimensionNames,crossBorderScore:e.crossBorderScore??0};return H(d)}const l=Object.entries(e.dimensionScores).map(([d,f])=>{const S=e.dimensionNames[d]||d,b=f>=80?"#22C55E":f>=65?n:f>=50?"#EAB308":"#888888",v=Math.max(0,Math.min(100,f));return`<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #F0F0F0;font-size:14px;font-weight:500;">${S}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #F0F0F0;text-align:center;font-family:Georgia,serif;font-weight:700;font-size:18px;color:${b};">${f}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #F0F0F0;">
          <div style="width:100%;height:10px;background:#F0F0F0;">
            <div style="height:100%;width:${v}%;background:${b};"></div>
          </div>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #F0F0F0;text-align:center;font-weight:600;font-size:13px;color:${b};">
          ${f>=80?"Elite":f>=65?"Advanced":f>=50?"Established":"Developing"}
        </td>
      </tr>`}).join(""),t=(e.strengths||[]).map(d=>`<li style="padding:8px 0 8px 24px;position:relative;font-size:14px;border-bottom:1px solid #F5F5F5;">
      <span style="position:absolute;left:0;font-weight:700;color:${n};">▸</span>
      <strong>${d.title}</strong> — ${d.text}
    </li>`).join("")||'<li style="padding:8px 0;font-size:14px;color:#999;">Narrative analysis pending</li>',g=(e.gaps||[]).map(d=>`<li style="padding:8px 0 8px 24px;position:relative;font-size:14px;border-bottom:1px solid #F5F5F5;">
      <span style="position:absolute;left:0;font-weight:700;color:${n};">▸</span>
      <strong>${d.title}</strong> — ${d.text}
    </li>`).join("")||'<li style="padding:8px 0;font-size:14px;color:#999;">Narrative analysis pending</li>',y=(e.development_actions||[]).sort((d,f)=>d.priority-f.priority).map((d,f)=>`<li style="display:flex;align-items:flex-start;gap:14px;padding:14px 0;border-bottom:1px solid #F0F0F0;font-size:14px;">
      <span style="flex-shrink:0;width:32px;height:32px;background:${n};color:#fff;font-family:Georgia,serif;font-weight:700;display:flex;align-items:center;justify-content:center;font-size:15px;">${f+1}</span>
      <div>
        <div style="font-weight:600;margin-bottom:4px;">${d.dimension}</div>
        <div style="color:#333;line-height:1.6;">${d.action}</div>
        <div style="font-size:12px;color:#999;margin-top:4px;">Timeline: ${d.timeline}</div>
      </div>
    </li>`).join("")||`<li style="display:flex;align-items:flex-start;gap:14px;padding:14px 0;border-bottom:1px solid #F0F0F0;font-size:14px;">
      <span style="flex-shrink:0;width:32px;height:32px;background:${n};color:#fff;font-family:Georgia,serif;font-weight:700;display:flex;align-items:center;justify-content:center;font-size:15px;">1</span>
      <div>
        <div style="font-weight:600;margin-bottom:4px;">Focused Practice</div>
        <div style="color:#333;line-height:1.6;">Identify your lowest-scoring dimension and schedule a weekly 60-minute focused practice for the next 90 days.</div>
        <div style="font-size:12px;color:#999;margin-top:4px;">Timeline: 90 days</div>
      </div>
    </li>`,h=i?.retakeLink?`<a href="${i.retakeLink}" style="display:inline-block;padding:12px 24px;background:${n};color:#fff;font-weight:600;text-decoration:none;font-size:14px;">Retake Assessment</a>`:"",c=i?.shareLink?`<a href="${i.shareLink}" style="display:inline-block;padding:12px 24px;background:#111;color:#fff;font-weight:600;text-decoration:none;font-size:14px;">Share Report</a>`:"",x=i?.includeFooter===!1?"":`
    <div style="text-align:center;padding:24px 0;font-size:12px;color:#999;border-top:2px solid ${n};margin-top:40px;">
      LYC Intelligence · ${m}<br>
      Confidential — Generated ${r.toISOString().split("T")[0]}
    </div>`;return`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${m} — ${e.archetype}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'DM Sans',system-ui,sans-serif; color:#1a1a1a; line-height:1.6; background:#FFFFFF; }
  .page { width:210mm; min-height:297mm; padding:22mm 20mm; margin:0 auto; background:#fff; }
  .section { margin-bottom:36px; page-break-inside:avoid; }
  h1,h2,h3 { font-family:'Libre Baskerville',Georgia,serif; color:#1a1a1a; }
  h2 { font-size:22px; border-bottom:2px solid ${n}; padding-bottom:8px; margin-bottom:16px; }
  h3 { font-size:16px; margin-bottom:8px; }
  .accent { color:${n}; }
  .mono { font-family:'IBM Plex Mono','Courier New',monospace; }
  .cover { text-align:center; padding:60px 0 40px; border-bottom:3px solid ${n}; margin-bottom:40px; }
  .cover .brand { font-family:'Libre Baskerville',serif; font-size:28px; font-weight:700; color:${n}; letter-spacing:1px; margin-bottom:8px; }
  .cover h1 { font-size:32px; margin:16px 0 8px; }
  .cover .subtitle { font-size:15px; color:#666; margin-bottom:24px; }
  .cover .meta { display:inline-block; padding:16px 32px; background:#F5F5F5; border-left:4px solid ${n}; text-align:left; }
  .cover .meta-row { font-size:14px; margin:4px 0; }
  .cover .meta-label { color:#666; display:inline-block; width:110px; }
  .archetype-badge { display:inline-block; margin-top:20px; padding:10px 28px; background:${n}; color:#fff; font-family:'Libre Baskerville',serif; font-size:18px; font-weight:700; }
  .score-display { display:flex; align-items:center; gap:24px; margin-bottom:16px; }
  .score-circle { width:110px; height:110px; border-radius:50%; border:6px solid ${n}; display:flex; flex-direction:column; align-items:center; justify-content:center; flex-shrink:0; }
  .score-circle .num { font-family:'Libre Baskerville',serif; font-size:34px; font-weight:700; color:${n}; line-height:1; }
  .score-circle .max { font-size:12px; color:#999; }
  .score-info .tier { font-family:'Libre Baskerville',serif; font-size:20px; color:${n}; font-weight:700; }
  .score-info .archetype { font-size:16px; color:#333; margin-top:4px; }
  .score-info .tagline { font-size:13px; color:#666; font-style:italic; margin-top:4px; }
  table.dimensions { width:100%; border-collapse:collapse; }
  table.dimensions th { text-align:left; font-size:12px; text-transform:uppercase; letter-spacing:0.5px; color:#999; padding:8px 12px; border-bottom:1px solid #E5E5E5; }
  ul.clean { list-style:none; padding:0; }
  .cb-box { padding:20px; background:#F9F5FA; border-left:4px solid ${n}; }
  .actions { display:flex; gap:12px; flex-wrap:wrap; }
  @media print { .page { width:auto; min-height:auto; padding:15mm; margin:0; } .section { page-break-inside:avoid; } }
</style>
</head>
<body>
<div class="page">
  <div class="cover">
    <div class="brand">LYC INTELLIGENCE</div>
    <h1>${m}</h1>
    <p class="subtitle">Executive Leadership Assessment Report</p>
    <div class="meta">
      <div class="meta-row"><span class="meta-label">Instrument</span> ${s}</div>
      <div class="meta-row"><span class="meta-label">Date</span> ${r.toISOString().split("T")[0]}</div>
      ${e.userId?`<div class="meta-row"><span class="meta-label">User ID</span> <span class="mono">${e.userId.slice(0,8)}…</span></div>`:""}
    </div>
    <div class="archetype-badge">${e.archetype}</div>
  </div>

  <div class="section">
    <h2>Executive Summary</h2>
    <div class="score-display">
      <div class="score-circle">
        <span class="num">${e.compositeScore}</span>
        <span class="max">/ 100</span>
      </div>
      <div class="score-info">
        <div class="tier">${e.tierLabel}</div>
        <div class="archetype">${e.archetype}</div>
        ${e.archetypeTagline?`<div class="tagline">"${e.archetypeTagline}"</div>`:""}
      </div>
    </div>
    <p style="font-size:14px;color:#333;line-height:1.7;">
      ${e.archetypeDescription||`Your leadership profile (${e.archetype}) reflects a composite score of ${e.compositeScore}/100, placing you in the ${e.tierLabel} tier. Review the dimension breakdown and development plan below for targeted recommendations.`}
    </p>
  </div>

  <div class="section">
    <h2>Dimension Breakdown</h2>
    <table class="dimensions">
      <thead><tr><th>Dimension</th><th style="width:10%;">Score</th><th style="width:40%;"></th><th style="width:15%;">Tier</th></tr></thead>
      <tbody>${l}</tbody>
    </table>
  </div>

  <div class="section">
    <h2>Leadership Profile — <span class="accent">${e.archetype}</span></h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
      <div>
        <h3>Key Strengths</h3>
        <ul class="clean">${t}</ul>
      </div>
      <div>
        <h3>Development Areas</h3>
        <ul class="clean">${g}</ul>
      </div>
    </div>
  </div>

  ${e.crossBorderScore!==void 0?`
  <div class="section">
    <h2>Cross-Border Readiness</h2>
    <div class="cb-box">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:12px;">
        <div style="font-family:'Libre Baskerville',serif;font-size:28px;font-weight:700;color:${j(e.crossBorderScore).color};">
          ${e.crossBorderScore}<span style="font-size:14px;color:#999;"> / 100</span>
        </div>
        <div>
          <div style="font-weight:600;color:${j(e.crossBorderScore).color};">
            ${j(e.crossBorderScore).label} Readiness
          </div>
          <div style="font-size:13px;color:#666;">Cross-border adaptability indicator</div>
        </div>
      </div>
    </div>
  </div>`:""}

  <div class="section">
    <h2>90-Day Action Plan</h2>
    <ol style="list-style:none;padding:0;">${y}</ol>
  </div>

  ${h||c?`<div class="section actions">${h}${c}</div>`:""}

  ${x}
</div>
</body>
</html>`}async function ne(a,e,i){try{const s=await T(a,e,{...i,persist:i?.persist??!0});if(!s||typeof s.compositeScore!="number")return{ok:!1,error:"Scoring failed — no composite score returned"};const n=await B(a,s,{accent:"#C108AB",includeFooter:!0,generatedAt:new Date,retakeLink:i?.retakeLink,shareLink:i?.shareLink});let r;try{if(typeof _=="function"){const m=await _("assessment-report","PDF",{instrumentKey:a,resultId:s.id,compositeScore:s.compositeScore});m?.reportId&&(r=m.reportId)}}catch{}return{ok:!0,result:s,html:n,reportId:r}}catch(s){return{ok:!1,error:s?.message||String(s)}}}async function U(a,e){const i=a.toUpperCase(),s=z[i]||`${i} Assessment`,n=new Date().toISOString().split("T")[0],r=e?await re(e):void 0;return{instrumentKey:i,resultId:e,title:`${s} Report${r?.archetype?` — ${r.archetype}`:""}`,downloadFilename:`LYC_${i}_Report_${e||n}.html`,shareUrl:e?`/share/assessment/${e}`:void 0,retakeUrl:`/${i.toLowerCase()}/take`,generatedAt:r?.generatedAt?new Date(r.generatedAt):new Date}}async function re(a){try{const e=(await Z(async()=>{const{getSupabase:s}=await import("./index-BQrg3B7Q.js").then(n=>n.a4);return{getSupabase:s}},__vite__mapDeps([0,1,2,3,4,5,6,7]))).getSupabase(),{data:i}=await e.from("assessment_results").select("*").eq("id",a).single();return i?{archetype:i.archetype,generatedAt:i.generated_at,compositeScore:i.composite_score}:null}catch{return null}}function ae(a,e){const i=a.toUpperCase(),s=O[i]||"#C108AB",n=z[i]||i,r=`${i.toLowerCase()}-results`,m=i.toLowerCase(),l=Object.entries(e.dimensionScores).map(([t,g])=>({id:t,name:e.dimensionNames[t]||t,score:g,lowLabel:"Low",highLabel:"High",description:`${e.dimensionNames[t]||t} dimension score`}));return{assessmentCode:i,assessmentName:n,accent:s,prefix:r,overallScore:e.compositeScore,archetype:{name:e.archetype,description:e.archetypeDescription||`${e.archetype} leadership profile.`,traits:e.archetypeStrengths||[]},dimensions:l,insights:[...(e.strengths||[]).map(t=>({...t,type:"strength"})),...(e.gaps||[]).map(t=>({...t,type:"gap"}))],developmentActions:e.development_actions||[],retakePath:`/${m}/take`,nexusPath:"/nexus/chat"}}const N="#000000",F="#F5F5F3",A="#E8E8E5",I="#8A8A82",w="#52524B",u="#C108AB",C={width:"100%",maxWidth:"1120px",margin:"0 auto",padding:"0 32px"},D={fontFamily:"'IBM Plex Mono', 'Courier New', monospace",textTransform:"uppercase",letterSpacing:"0.08em"},E={fontFamily:"'Libre Baskerville', Georgia, serif"},M={fontFamily:"'DM Sans', system-ui, sans-serif"};function R(a,e,i){return{...ae(a,e),accent:u,...i}}async function ce(a,e){if(e)try{const t=await U(a,e),g=`assessment_answers_${a}_${e}`,y=sessionStorage.getItem(g),h=y?JSON.parse(y):{},c=await T(a,h,{persist:!1}),x=R(a,c),d=await B(a,c,{accent:u,includeFooter:!0,generatedAt:t.generatedAt});return{result:c,config:x,html:d,source:"resultId"}}catch(t){console.warn("[GenericAkiraResults] resultId lookup failed, falling back:",t)}const i=`assessment_answers_${a}_latest`,s=sessionStorage.getItem(i);if(s)try{const t=JSON.parse(s),g=await ne(a,t,{persist:!1});if(g.ok){const y=R(a,g.result);return{result:g.result,config:y,html:g.html,source:"session"}}}catch(t){console.warn("[GenericAkiraResults] session re-score failed:",t)}const n={};for(let t=1;t<=20;t++)n[`q_${t}`]=3.5+t%3*.5;const r=await T(a,n,{persist:!1}),m=R(a,r,{overallScore:72}),l=await B(a,r,{accent:u,includeFooter:!0,generatedAt:new Date});return{result:r,config:m,html:l,source:"mock"}}function le(a,e){const i=new Blob([e],{type:"text/html;charset=utf-8"}),s=URL.createObjectURL(i),n=document.createElement("a");n.href=s,n.download=a,document.body.appendChild(n),n.click(),document.body.removeChild(n),setTimeout(()=>URL.revokeObjectURL(s),1e3)}function be({instrumentKey:a,resultId:e,loading:i,error:s}){const n=W(),r=a.toUpperCase(),m=e||n?.id,[l,t]=$.useState({loading:!0,error:s||null,config:null,result:null,standaloneHtml:null,sourceLabel:null}),g=$.useCallback(async()=>{t(c=>({...c,loading:!0,error:s||null}));try{const{result:c,config:x,html:d,source:f}=await ce(r,m);if(!x||!c){t(v=>({...v,loading:!1,error:"Unable to build assessment results."}));return}let S=d||"";if(r==="CPI"&&c.compositeScore!==void 0)try{const v={name:"Assessment Participant",date:new Date(c.generatedAt).toISOString().split("T")[0],compositeScore:c.compositeScore,tierLabel:c.tierLabel,archetype:c.archetype,archetypeTagline:c.archetypeTagline,archetypeDescription:c.archetypeDescription,archetypeStrengths:c.archetypeStrengths,archetypeDevelopment:c.archetypeDevelopment,dimensionScores:c.dimensionScores,dimensionNames:c.dimensionNames,crossBorderScore:c.crossBorderScore??0,narrative:{}};S=H(v)}catch{}const b=await U(r,m||c.id);t({loading:!1,error:null,config:{...x,accent:u},result:c,standaloneHtml:S,sourceLabel:b.title})}catch(c){t(x=>({...x,loading:!1,error:c?.message||"Failed to load results."}))}},[r,m,s]);$.useEffect(()=>{g()},[g]);const y=$.useCallback(()=>{if(!l.standaloneHtml||!l.sourceLabel)return;const c=`LYC_${r}_Report_${m||new Date().toISOString().split("T")[0]}.html`;le(c,l.standaloneHtml)},[r,m,l.standaloneHtml,l.sourceLabel]);if(i||l.loading)return o.jsx("div",{style:{background:F,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",...M},children:o.jsxs("div",{style:{textAlign:"center"},children:[o.jsx("div",{style:{width:32,height:32,border:`2px solid ${A}`,borderTopColor:u,animation:"spin 0.8s linear infinite",margin:"0 auto 24px"}}),o.jsxs("p",{style:{color:w,fontSize:14},children:["Loading your ",r," results…"]}),o.jsx("style",{children:"@keyframes spin { to { transform: rotate(360deg); } }"})]})});if(s||l.error)return o.jsx("div",{style:{background:F,minHeight:"100vh",...M},children:o.jsx("div",{style:{...C,paddingTop:80,paddingBottom:80},children:o.jsxs("div",{style:{padding:24,background:"#FEF2F2",border:"1px solid #FECACA",display:"flex",alignItems:"flex-start",gap:12},children:[o.jsx(oe,{style:{width:20,height:20,color:"#DC2626",flexShrink:0,marginTop:2}}),o.jsxs("div",{children:[o.jsx("h3",{style:{...E,fontSize:18,marginBottom:4},children:"Unable to load results"}),o.jsx("p",{style:{fontSize:14,color:w,marginBottom:12},children:s||l.error}),o.jsx("button",{onClick:g,style:{padding:"10px 18px",background:u,color:"#FFF",border:"none",cursor:"pointer",fontSize:14,fontWeight:600},children:"Retry"})]})]})})});if(!l.config)return null;const h={...l.config,accent:u};return o.jsxs("div",{style:{background:F,color:N,minHeight:"100vh",fontFamily:"'DM Sans', system-ui, sans-serif",lineHeight:1.6,WebkitFontSmoothing:"antialiased"},children:[o.jsx("header",{style:{position:"sticky",top:0,left:0,right:0,background:"rgba(245,245,243,0.96)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",zIndex:100,borderBottom:`1px solid ${A}`},children:o.jsxs("div",{style:{...C,padding:"16px 32px",display:"flex",justifyContent:"space-between",alignItems:"center"},children:[o.jsxs("div",{style:{display:"flex",alignItems:"baseline",gap:8},children:[o.jsx("span",{style:{...E,fontSize:20,fontWeight:700},children:r}),o.jsx("span",{style:{...D,fontSize:10,fontWeight:400,color:I},children:"RESULTS"}),l.sourceLabel&&o.jsxs("span",{style:{fontSize:12,color:w,marginLeft:12},children:["· ",l.sourceLabel.replace(/^.*—\s*/,"")]})]}),o.jsx("div",{style:{display:"flex",gap:10,alignItems:"center"},children:o.jsxs("button",{onClick:y,disabled:!l.standaloneHtml,style:{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 20px",minHeight:38,background:u,color:"#FFF",border:"none",cursor:l.standaloneHtml?"pointer":"not-allowed",opacity:l.standaloneHtml?1:.6,fontSize:13,fontWeight:600,transition:"opacity 120ms ease"},children:[o.jsx(ie,{style:{width:14,height:14}}),"Download full HTML report"]})})]})}),o.jsx("main",{children:o.jsxs("div",{style:C,children:[o.jsx("div",{style:{paddingTop:24},children:o.jsx(Y,{config:h})}),o.jsx(K,{config:h}),o.jsx(Q,{config:h}),o.jsx(V,{config:h}),o.jsx(q,{config:h}),o.jsx(J,{config:h}),o.jsx(X,{config:h})]})}),o.jsx("footer",{style:{background:F,borderTop:`1px solid ${A}`,padding:"64px 0 32px",marginTop:64},children:o.jsxs("div",{style:C,children:[o.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:48},children:[o.jsxs("div",{children:[o.jsx("span",{style:{...E,fontSize:18,fontWeight:700,color:N},children:r}),o.jsx("p",{style:{fontSize:13,color:w,marginTop:12,lineHeight:1.5,maxWidth:300},children:"Part of the LYC Intelligence diagnostic suite. Know where you stand. Know where to go."})]}),o.jsxs("div",{children:[o.jsx("div",{style:{...D,color:I,marginBottom:12},children:"Platform"}),o.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:8},children:[o.jsx("a",{href:"/nexus",style:{color:w,textDecoration:"none",fontSize:13},children:"NEXUS"}),o.jsx("a",{href:"/pricing",style:{color:w,textDecoration:"none",fontSize:13},children:"Pricing"})]})]})]}),o.jsxs("div",{style:{paddingTop:32,borderTop:`1px solid ${A}`,display:"flex",justifyContent:"space-between",alignItems:"center"},children:[o.jsx("span",{style:{fontSize:12,color:I},children:"© 2026 LYC Intelligence by LYC Partners."}),o.jsx("span",{style:{...D,color:u},children:r})]})]})})]})}export{be as G};
