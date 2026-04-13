import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, CheckCircle2, XCircle, Loader2, Trash2, Phone, CreditCard,
  User, MapPin, Calendar, Send, RefreshCw, ChevronDown, ChevronUp,
  AlertTriangle, Users, Building2, Vote, Tag
} from 'lucide-react';
import { useAuth } from '../lib/auth';

// Responsive hook — inline to prevent module initialization order issues
import { useState as _useStateW, useEffect as _useEffectW } from 'react';
function useW() {
  const [_w, _setW] = _useStateW(typeof window !== 'undefined' ? window.innerWidth : 1440);
  _useEffectW(() => { const _fn = () => _setW(window.innerWidth); window.addEventListener('resize', _fn); return () => window.removeEventListener('resize', _fn); }, []);
  return _w;
}
const isMob = (_w: number) => _w < 640;
const isTab = (_w: number) => _w >= 640 && _w < 1024;

;

// ── Types ──────────────────────────────────────────────────────
interface Pilgrim {
  id: string;
  full_name: string; aadhaar: string; phone: string; age: string; gender: string; darshan_type: string;
  mandal: string; village: string; town: string; assembly_segment: string;
  voter_id: string; party_connection: string; referral_name: string;
  is_constituency_voter: boolean | null; occupation: string; notes: string;
  validation: 'idle' | 'checking' | 'valid' | 'invalid' | 'error';
  validation_msg: string; aadhaar_last4: string;
}
interface Quota { used: number; remaining: number; max: number; date: string; can_book: boolean; }
interface PilgrimRecord {
  id: number; full_name: string; phone: string; aadhaar_last4: string;
  darshan_type: string; mandal?: string; village?: string;
  party_connection?: string; sms_sent: number; booking_id?: number; booking_ref?: string;
  status?: string; letter_date?: string;
}

// ── Constants ──────────────────────────────────────────────────
const DARSHAN_TYPES = ['SSD Darshan','VIP Break Darshan','Special Entry Darshan','Arjitha Seva'];
const PARTY_CONNECTIONS = [
  {value:'party_worker',label:'Party Worker'},
  {value:'voter',label:'Voter / Supporter'},
  {value:'general_public',label:'General Public'},
  {value:'referred',label:'Referred by Karyakarta'},
];

const mkPilgrim = (): Pilgrim => ({
  id: Math.random().toString(36).slice(2),
  full_name:'', aadhaar:'', phone:'', age:'', gender:'Male', darshan_type:'SSD Darshan',
  mandal:'', village:'', town:'', assembly_segment:'', voter_id:'',
  party_connection:'voter', referral_name:'', is_constituency_voter:null,
  occupation:'', notes:'', validation:'idle', validation_msg:'', aadhaar_last4:'',
});
const fmtAadhaar = (v:string) => {
  // Strip everything non-digit first
  const d = v.replace(/\D/g,'').slice(0,12);
  // Format as XXXX XXXX XXXX
  if (d.length <= 4) return d;
  if (d.length <= 8) return d.slice(0,4) + ' ' + d.slice(4);
  return d.slice(0,4) + ' ' + d.slice(4,8) + ' ' + d.slice(8);
};

// ── Styles ─────────────────────────────────────────────────────
const C: React.CSSProperties = {background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,padding:18};
const L: React.CSSProperties = {fontSize:10,fontWeight:700,color:'#8899bb',textTransform:'uppercase',letterSpacing:0.8,display:'block',marginBottom:5};
const I: React.CSSProperties = {width:'100%',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'7px 11px',color:'#f0f4ff',fontSize:12,outline:'none',boxSizing:'border-box'};
const pill = (a:boolean): React.CSSProperties => ({padding:'4px 10px',borderRadius:7,fontSize:10,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap',background:a?'rgba(0,212,170,0.15)':'rgba(255,255,255,0.05)',border:`1px solid ${a?'rgba(0,212,170,0.4)':'rgba(255,255,255,0.08)'}`,color:a?'#00d4aa':'#8899bb'});
const BTN: React.CSSProperties = {background:'linear-gradient(135deg,#00d4aa,#1e88e5)',border:'none',borderRadius:10,padding:'8px 18px',color:'#060b18',fontWeight:800,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:6};

export default function Darshan() {
  const { session } = useAuth();
  const w = useW();
  const token = session?.access_token || localStorage.getItem('nethra_token') || '';
  const [quota, setQuota] = useState<Quota>({used:0,remaining:6,max:6,date:'',can_book:true});
  const [groups, setGroups] = useState<{ref:string;id:number;status:string;pilgrims:PilgrimRecord[]}[]>([]);
  const [pilgrims, setPilgrims] = useState<Pilgrim[]>([mkPilgrim()]);
  const [visitDate, setVisitDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ref:string;count:number}|null>(null);
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedRef, setExpandedRef] = useState<string|null>(null);
  const [selectedGroup, setSelectedGroup] = useState<typeof groups[0]|null>(null);
  const [approvalForm, setApprovalForm] = useState({contact_person:'',contact_phone:'',pickup_point:'TTD Ticket Counter, Tirumala',shrine_contacts:'155257'});
  const [approving, setApproving] = useState(false);
  const [approvalMsg, setApprovalMsg] = useState('');
  const [feed, setFeed] = useState<{id:string;text:string;color:string}[]>([]);

  const today = new Date().toISOString().slice(0,10);
  const h = {Authorization:`Bearer ${token}`,'Content-Type':'application/json'};

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [qr,br] = await Promise.all([
        fetch(`/api/darshan/quota?date=${today}`,{headers:h}),
        fetch(`/api/darshan/bookings?date=${today}&limit=100`,{headers:h}),
      ]);
      if (qr.ok) { const q=await qr.json(); setQuota({used:q.used??0,remaining:q.remaining??6,max:q.max??6,date:q.date??today,can_book:q.can_book!==false}); }
      if (br.ok) {
        const raw=await br.json();
        const list:PilgrimRecord[]=Array.isArray(raw)?raw:raw.bookings??[];
        const g:{[k:string]:{ref:string;id:number;status:string;pilgrims:PilgrimRecord[]}}={};
        list.forEach(p=>{
          const ref=p.booking_ref||'';
          if (!ref) return;
          if (!g[ref]) g[ref]={ref,id:p.booking_id??p.id,status:p.status??'pending',pilgrims:[]};
          g[ref].pilgrims.push(p);
        });
        setGroups(Object.values(g).sort((a,b)=>b.ref.localeCompare(a.ref)));
      }
    } catch(_){}
    setLoading(false);
  },[today]);

  useEffect(()=>{
    fetchAll();
    const t=new Date(); t.setDate(t.getDate()+1);
    setVisitDate(t.toISOString().slice(0,10));
  },[]);

  // Keep a ref that always holds current pilgrims — used by validate() to avoid stale closures
  const pilgrimsRef = useRef<Pilgrim[]>([]);
  const up=(id:string,patch:Partial<Pilgrim>)=>setPilgrims(prev=>{
    const next=prev.map(p=>p.id===id?{...p,...patch}:p);
    pilgrimsRef.current=next;
    return next;
  });
  // Sync ref when pilgrims changes from external sources (setCount etc)
  useEffect(()=>{pilgrimsRef.current=pilgrims;},[pilgrims]);
  const addFeed=(id:string,text:string,color:string)=>setFeed(f=>[{id:id+Date.now(),text,color},...f].slice(0,12));

  async function validate(id:string){
    // Use ref to always get current state — avoids stale closure bug
    const current = pilgrimsRef.current;
    const p=current.find(x=>x.id===id); if(!p||p.validation==='checking') return;
    const ca=p.aadhaar.replace(/\s/g,''); const cp=p.phone.replace(/\D/g,'').slice(-10);
    if (ca.length!==12||cp.length!==10) return;
    const idx=current.findIndex(x=>x.id===id)+1;
    up(id,{validation:'checking',validation_msg:''});
    addFeed(id,`Checking Pilgrim ${idx}...`,'#64b5f6');
    try {
      const r=await fetch('/api/darshan/validate-pilgrim',{method:'POST',headers:h,body:JSON.stringify({aadhaar:ca,phone:cp})});
      const d=await r.json();
      if (d.valid) {
        up(id,{validation:'valid',validation_msg:'Eligible for Darshan ✓',aadhaar_last4:ca.slice(-4)});
        addFeed(id,`Pilgrim ${idx}${p.full_name?' — '+p.full_name:''} ✓ Eligible`,'#00d4aa');
      } else {
        const msg=d.reason==='already_visited'?`Visited ${d.last_visit} · Next: ${d.next_eligible}`:(d.message||'Not eligible');
        up(id,{validation:'invalid',validation_msg:msg});
        addFeed(id,`Pilgrim ${idx} ✗ ${msg}`,'#ff5555');
      }
    } catch(_){ up(id,{validation:'error',validation_msg:'Network error — proceed with caution'}); addFeed(id,`Pilgrim ${idx} — Check failed`,'#ffa726'); }
  }

  function onAadhaar(id:string,v:string){ up(id,{aadhaar:fmtAadhaar(v),validation:'idle',validation_msg:'',aadhaar_last4:''}); }
  function onAadhaarBlur(id:string){ const p=pilgrimsRef.current.find(x=>x.id===id); if(p&&p.aadhaar.replace(/\s/g,'').length===12&&p.phone.replace(/\D/g,'').length===10) validate(id); }
  function onPhone(id:string,v:string){
    const d=v.replace(/\D/g,'').slice(0,10);
    up(id,{phone:d,validation:'idle',validation_msg:''});
    // Read aadhaar from ref (always current) then trigger validation
    const currentAadhaar = pilgrimsRef.current.find(x=>x.id===id)?.aadhaar || '';
    if (currentAadhaar.replace(/\s/g,'').length===12 && d.length===10){
      setTimeout(()=>validate(id),300);
    }
  }

  function setCount(n:number){ if(n<1||n>quota.remaining) return; setPilgrims(prev=>n>prev.length?[...prev,...Array(n-prev.length).fill(null).map(mkPilgrim)]:prev.slice(0,n)); }

  // Can submit if: all names filled, visit date set, no INVALID pilgrims
  // validation='idle' or 'error' is allowed (network issues shouldn't block staff)
  // validation='checking' blocks (wait for result)
  const hasInvalid = pilgrims.some(p=>p.validation==='invalid');
  const hasChecking = pilgrims.some(p=>p.validation==='checking');
  const allNamed = pilgrims.every(p=>p.full_name.trim().length>1);
  const allAadhaarFilled = pilgrims.every(p=>p.aadhaar.replace(/\s/g,'').length===12);
  const allPhoneFilled = pilgrims.every(p=>p.phone.length===10);
  const allReady = pilgrims.length>0
    && allNamed
    && !hasInvalid
    && !hasChecking
    && !!visitDate;

  async function submit(){
    if (!allReady) return;
    setSubmitting(true); setSubmitError('');
    try {
      const r=await fetch('/api/darshan/bookings',{method:'POST',headers:h,body:JSON.stringify({
        visit_date:visitDate,
        pilgrims:pilgrims.map(p=>({
          full_name:p.full_name.trim(),aadhaar:p.aadhaar.replace(/\s/g,''),phone:p.phone,
          age:parseInt(p.age)||null,gender:p.gender,darshan_type:p.darshan_type,
          address:[p.village||p.town,p.mandal].filter(Boolean).join(', '),
          mandal:p.mandal||null,village:p.village||null,town:p.town||null,
          assembly_segment:p.assembly_segment||null,voter_id:p.voter_id||null,
          party_connection:p.party_connection,referral_name:p.referral_name||null,
          is_constituency_voter:p.is_constituency_voter,occupation:p.occupation||null,notes:p.notes||null,
        })),
      })});
      const d=await r.json();
      if (!r.ok) throw new Error(d.error||d.message||'Booking failed');
      setSubmitResult({ref:d.booking_ref,count:pilgrims.length});
      setPilgrims([mkPilgrim()]); setFeed([]);
      await fetchAll();
    } catch(e:any){ setSubmitError(e.message); }
    setSubmitting(false);
  }

  async function approve(){
    if (!selectedGroup) return;
    setApproving(true);
    try {
      const r=await fetch(`/api/darshan/bookings/${selectedGroup.id}/approve`,{method:'PUT',headers:h,body:JSON.stringify({approved_by:'Politician',...approvalForm})});
      const d=await r.json();
      if (!r.ok) throw new Error(d.error||'Failed');
      setApprovalMsg(`✓ Approved ${selectedGroup.pilgrims.length} pilgrims. SMS sent.`);
      setSelectedGroup(null); await fetchAll(); setTimeout(()=>setApprovalMsg(''),5000);
    } catch(e:any){ setApprovalMsg('Error: '+e.message); }
    setApproving(false);
  }

  const pct=Math.min((quota.used/quota.max)*100,100);
  const qC=quota.remaining===0?'#ff5555':quota.remaining<=2?'#ffa726':'#00d4aa';
  const R=50,circ=2*Math.PI*R;

  return (
    <div style={{display:isMob(w)?'flex':'grid',flexDirection:'column',gridTemplateColumns:'260px 1fr 300px',gap:14,minHeight:isMob(w)?'auto':'calc(100vh - 120px)',alignItems:'start'}}>
      <style>{`
        @media (max-width: 1023px) { :root { --darshan-cols: 1fr; } .darshan-col2, .darshan-col3 { display: none !important; } }
        @media (min-width: 1024px) { :root { --darshan-cols: 260px 1fr 300px; } }
      `}</style>

      {/* COL 1: QUOTA + HISTORY */}
      <div style={{display:'flex',flexDirection:'column',gap:12,overflow:'hidden'}}>
        <div style={{...C,textAlign:'center'}}>
          <div style={{fontSize:10,fontWeight:700,color:'#8899bb',letterSpacing:1,textTransform:'uppercase',marginBottom:12}}>Daily Quota</div>
          <div style={{position:'relative',width:110,height:110,margin:'0 auto 10px'}}>
            <svg width="110" height="110" style={{transform:'rotate(-90deg)'}}>
              <circle cx="55" cy="55" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10"/>
              <circle cx="55" cy="55" r={R} fill="none" stroke={qC} strokeWidth="10"
                strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)} strokeLinecap="round"
                style={{transition:'stroke-dashoffset 0.5s ease,stroke 0.3s'}}/>
            </svg>
            <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
              <div style={{fontSize:28,fontWeight:900,color:qC,fontFamily:'Space Grotesk'}}>{quota.remaining}</div>
              <div style={{fontSize:9,color:'#8899bb'}}>remaining</div>
            </div>
          </div>
          <div style={{fontSize:11,color:'#8899bb'}}>{quota.used} of {quota.max} used today</div>
          {quota.remaining===0&&<div style={{marginTop:8,padding:'4px 10px',borderRadius:8,background:'rgba(255,85,85,0.1)',border:'1px solid rgba(255,85,85,0.2)',fontSize:10,color:'#ff7777'}}>Daily limit reached</div>}
        </div>

        <div style={{...C,flex:1,overflow:'hidden',display:'flex',flexDirection:'column',padding:0}}>
          <div style={{padding:'12px 14px',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span style={{fontSize:12,fontWeight:700,color:'#f0f4ff'}}>Today's Bookings</span>
            <button onClick={fetchAll} style={{background:'none',border:'none',color:'#8899bb',cursor:'pointer'}}><RefreshCw size={11}/></button>
          </div>
          <div style={{overflow:'auto',flex:1}}>
            {loading?<div style={{padding:20,textAlign:'center',color:'#8899bb',fontSize:11}}>Loading...</div>
            :groups.length===0?<div style={{padding:24,textAlign:'center'}}><Star size={22} style={{color:'#8899bb',opacity:0.25,margin:'0 auto 8px'}}/><div style={{fontSize:11,color:'#8899bb'}}>No bookings today</div></div>
            :groups.map(g=>{
              const isE=expandedRef===g.ref;
              const sc=g.status==='approved'?'#00c864':'#ffa726';
              return (<div key={g.ref} style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                <button onClick={()=>setExpandedRef(isE?null:g.ref)} style={{width:'100%',padding:'10px 14px',background:'none',border:'none',cursor:'pointer',textAlign:'left'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div>
                      <div style={{fontSize:10,fontWeight:700,color:'#f0f4ff',fontFamily:'monospace'}}>{g.ref}</div>
                      <div style={{fontSize:9,color:'#8899bb',marginTop:1}}>{g.pilgrims.length} pilgrim{g.pilgrims.length!==1?'s':''}</div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <span style={{fontSize:8,padding:'2px 6px',borderRadius:100,fontWeight:700,background:`${sc}15`,color:sc}}>{g.status==='approved'?'Approved':'Pending'}</span>
                      {isE?<ChevronUp size={10} style={{color:'#8899bb'}}/>:<ChevronDown size={10} style={{color:'#8899bb'}}/>}
                    </div>
                  </div>
                </button>
                {isE&&<div style={{padding:'0 14px 10px'}}>
                  {g.pilgrims.map((p,i)=><div key={i} style={{padding:'5px 0',borderTop:'1px solid rgba(255,255,255,0.04)'}}>
                    <div style={{fontSize:11,color:'#f0f4ff',fontWeight:600}}>{p.full_name}</div>
                    <div style={{fontSize:9,color:'#8899bb'}}>****{p.aadhaar_last4} · {p.darshan_type}{p.mandal?` · ${p.mandal}`:''}</div>
                    <div style={{fontSize:9,color:'#8899bb',marginTop:1}}>
                      {p.party_connection==='party_worker'?'🟢 Party Worker':p.party_connection==='voter'?'🔵 Voter':'⚪ Public'}
                      {p.sms_sent?' · ✓ SMS':''}
                    </div>
                  </div>)}
                  {g.status!=='approved'&&<button onClick={()=>{setSelectedGroup(g);setExpandedRef(null);}} style={{marginTop:8,width:'100%',padding:'6px',borderRadius:8,background:'rgba(0,212,170,0.08)',border:'1px solid rgba(0,212,170,0.2)',color:'#00d4aa',fontSize:10,fontWeight:700,cursor:'pointer'}}>Approve & Send SMS →</button>}
                </div>}
              </div>);
            })}
          </div>
        </div>
      </div>

      {/* COL 2: BOOKING FORM */}
      <div style={{overflow:'auto',paddingRight:2}}>

        {submitResult&&<motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} style={{...C,textAlign:'center',marginBottom:14,border:'1px solid rgba(0,212,170,0.3)',background:'rgba(0,212,170,0.04)'}}>
          <CheckCircle2 size={36} style={{color:'#00d4aa',margin:'0 auto 10px'}}/>
          <div style={{fontSize:17,fontWeight:800,color:'#f0f4ff',fontFamily:'Space Grotesk',marginBottom:4}}>Booking Submitted</div>
          <div style={{fontSize:12,color:'#00d4aa',fontFamily:'monospace',marginBottom:6}}>{submitResult.ref}</div>
          <div style={{fontSize:11,color:'#8899bb',marginBottom:14}}>{submitResult.count} pilgrim{submitResult.count!==1?'s':''} · Awaiting approval</div>
          <button onClick={()=>setSubmitResult(null)} style={BTN}>Book More Pilgrims</button>
        </motion.div>}

        {!submitResult&&<>
          <div style={{...C,marginBottom:12}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:'#f0f4ff'}}>New Darshan Booking</div>
                <div style={{fontSize:11,color:'#8899bb',marginTop:2}}>{quota.remaining} slot{quota.remaining!==1?'s':''} available · Aadhaar verified</div>
              </div>
              <div style={{display:'flex',gap:6}}>
                {[1,2,3,4,5,6].map(n=>{const dis=n>quota.remaining;const sel=pilgrims.length===n;return(<button key={n} onClick={()=>!dis&&setCount(n)} disabled={dis} style={{width:34,height:34,borderRadius:9,fontWeight:800,fontSize:13,fontFamily:'Space Grotesk',cursor:dis?'not-allowed':'pointer',background:sel?'linear-gradient(135deg,#00d4aa,#1e88e5)':dis?'rgba(255,255,255,0.02)':'rgba(255,255,255,0.06)',color:sel?'#060b18':dis?'rgba(136,153,187,0.2)':'#f0f4ff',border:sel?'none':'1px solid rgba(255,255,255,0.08)'}}>{n}</button>);})}
              </div>
            </div>
            <label style={L}><Calendar size={9} style={{display:'inline',marginRight:4}}/>VISIT DATE *</label>
            <input type="date" value={visitDate} min={today} onChange={e=>setVisitDate(e.target.value)} style={I}/>
          </div>

          {submitError&&<div style={{padding:'10px 14px',borderRadius:10,background:'rgba(255,85,85,0.1)',border:'1px solid rgba(255,85,85,0.2)',color:'#ff7777',fontSize:12,marginBottom:12,display:'flex',alignItems:'center',gap:8}}><AlertTriangle size={13}/>{submitError}</div>}

          {pilgrims.map((p,i)=>{
            const vB=p.validation==='valid'?'rgba(0,212,170,0.4)':p.validation==='invalid'?'rgba(255,85,85,0.4)':p.validation==='checking'?'rgba(30,136,229,0.4)':p.validation==='error'?'rgba(255,167,38,0.4)':'rgba(255,255,255,0.08)';
            const vBg=p.validation==='valid'?'rgba(0,212,170,0.02)':p.validation==='invalid'?'rgba(255,85,85,0.02)':'rgba(255,255,255,0.04)';
            return (<motion.div key={p.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
              style={{background:vBg,border:`1px solid ${vB}`,borderRadius:16,padding:18,marginBottom:12,transition:'border-color 0.3s'}}>

              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:10,fontWeight:700,color:'#8899bb',letterSpacing:0.5}}>PILGRIM {i+1}</span>
                  {p.validation==='checking'&&<Loader2 size={12} style={{color:'#1e88e5',animation:'spin 1s linear infinite'}}/>}
                  {p.validation==='valid'&&<CheckCircle2 size={12} style={{color:'#00d4aa'}}/>}
                  {p.validation==='invalid'&&<XCircle size={12} style={{color:'#ff5555'}}/>}
                  {p.validation==='error'&&<AlertTriangle size={12} style={{color:'#ffa726'}}/>}
                </div>
                {pilgrims.length>1&&<button onClick={()=>setPilgrims(prev=>prev.filter(x=>x.id!==p.id))} style={{background:'none',border:'none',color:'#8899bb',cursor:'pointer',padding:2}}><Trash2 size={12}/></button>}
              </div>

              {/* IDENTITY */}
              <div style={{fontSize:9,fontWeight:800,color:'#8899bb',letterSpacing:1,textTransform:'uppercase',marginBottom:10,display:'flex',alignItems:'center',gap:6}}><User size={9}/> Identity</div>
              <div style={{display:'grid',gridTemplateColumns:isMob(w)?'1fr':'1fr 1fr',gap:10,marginBottom:14}}>
                <div style={{gridColumn:'1/-1'}}>
                  <label style={L}>Full Name (as on Aadhaar) *</label>
                  <input value={p.full_name} onChange={e=>up(p.id,{full_name:e.target.value})} placeholder="Full name" style={I}/>
                </div>
                <div>
                  <label style={L}><CreditCard size={9} style={{display:'inline',marginRight:3}}/>Aadhaar *</label>
                  <div style={{display:'flex',gap:6}}>
                    <input 
                      value={p.aadhaar} 
                      onChange={e=>onAadhaar(p.id,e.target.value)} 
                      onBlur={()=>onAadhaarBlur(p.id)}
                      placeholder="0000 0000 0000" 
                      maxLength={14}
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      style={{...I,fontFamily:'monospace',letterSpacing:1,flex:1,minWidth:0}}/>
                    {p.aadhaar.replace(/\s/g,'').length===12&&p.phone.length===10&&p.validation!=='valid'&&(
                      <button onClick={()=>validate(p.id)} disabled={p.validation==='checking'}
                        style={{padding:'0 10px',borderRadius:8,background:'rgba(0,212,170,0.1)',border:'1px solid rgba(0,212,170,0.25)',color:'#00d4aa',fontSize:10,fontWeight:700,cursor:'pointer',flexShrink:0,whiteSpace:'nowrap'}}>
                        {p.validation==='checking'?'...':'Check'}
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label style={L}><Phone size={9} style={{display:'inline',marginRight:3}}/>Mobile *</label>
                  <input value={p.phone} onChange={e=>onPhone(p.id,e.target.value)} placeholder="10 digits" maxLength={10} type="tel" style={I}/>
                </div>
                <div>
                  <label style={L}>Age</label>
                  <input value={p.age} onChange={e=>up(p.id,{age:e.target.value})} placeholder="Age" type="number" min="1" max="120" style={I}/>
                </div>
                <div>
                  <label style={L}>Gender</label>
                  <select value={p.gender} onChange={e=>up(p.id,{gender:e.target.value})} style={{...I,appearance:'none'}}>
                    {['Male','Female','Other'].map(g=><option key={g}>{g}</option>)}
                  </select>
                </div>
                <div style={{gridColumn:'1/-1'}}>
                  <label style={L}>Darshan Type *</label>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    {DARSHAN_TYPES.map(t=><button key={t} onClick={()=>up(p.id,{darshan_type:t})} style={pill(p.darshan_type===t)}>{t}</button>)}
                  </div>
                </div>
                <div>
                  <label style={L}>Occupation</label>
                  <input value={p.occupation} onChange={e=>up(p.id,{occupation:e.target.value})} placeholder="Farmer, Teacher..." style={I}/>
                </div>
                <div>
                  <label style={L}>Voter ID (optional)</label>
                  <input value={p.voter_id} onChange={e=>up(p.id,{voter_id:e.target.value.toUpperCase()})} placeholder="AP12345678" style={{...I,fontFamily:'monospace'}}/>
                </div>
              </div>

              {/* LOCATION */}
              <div style={{fontSize:9,fontWeight:800,color:'#8899bb',letterSpacing:1,textTransform:'uppercase',marginBottom:10,display:'flex',alignItems:'center',gap:6}}><MapPin size={9}/> Location & Constituency</div>
              <div style={{display:'grid',gridTemplateColumns:isMob(w)?'1fr':'1fr 1fr',gap:10,marginBottom:14}}>
                <div>
                  <label style={L}>Mandal *</label>
                  <input value={p.mandal} onChange={e=>up(p.id,{mandal:e.target.value})} placeholder="e.g. Kuppam" style={I}/>
                </div>
                <div>
                  <label style={L}>Village</label>
                  <input value={p.village} onChange={e=>up(p.id,{village:e.target.value})} placeholder="Village name" style={I}/>
                </div>
                <div>
                  <label style={L}>Nearest Town</label>
                  <input value={p.town} onChange={e=>up(p.id,{town:e.target.value})} placeholder="Town" style={I}/>
                </div>
                <div>
                  <label style={L}><Building2 size={9} style={{display:'inline',marginRight:3}}/>Assembly Segment</label>
                  <input value={p.assembly_segment} onChange={e=>up(p.id,{assembly_segment:e.target.value})} placeholder="e.g. Kuppam" style={I}/>
                </div>
                <div style={{gridColumn:'1/-1',display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                  <label style={{...L,marginBottom:0,flexShrink:0}}><Vote size={9} style={{display:'inline',marginRight:3}}/>Registered voter in constituency?</label>
                  <div style={{display:'flex',gap:6,marginLeft:'auto'}}>
                    {[{v:true,l:'Yes'},{v:false,l:'No'},{v:null,l:'Unknown'}].map(o=>(
                      <button key={String(o.v)} onClick={()=>up(p.id,{is_constituency_voter:o.v})} style={pill(p.is_constituency_voter===o.v)}>{o.l}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* POLITICAL CONNECTION */}
              <div style={{fontSize:9,fontWeight:800,color:'#8899bb',letterSpacing:1,textTransform:'uppercase',marginBottom:10,display:'flex',alignItems:'center',gap:6}}><Tag size={9}/> Political Connection</div>
              <div style={{display:'grid',gridTemplateColumns:isMob(w)?'1fr':'1fr 1fr',gap:10}}>
                <div style={{gridColumn:'1/-1'}}>
                  <label style={L}>Relationship to Politician</label>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    {PARTY_CONNECTIONS.map(c=><button key={c.value} onClick={()=>up(p.id,{party_connection:c.value})} style={pill(p.party_connection===c.value)}>{c.label}</button>)}
                  </div>
                </div>
                {p.party_connection==='referred'&&<div style={{gridColumn:'1/-1'}}>
                  <label style={L}>Referred by (Karyakarta name)</label>
                  <input value={p.referral_name} onChange={e=>up(p.id,{referral_name:e.target.value})} placeholder="Referring party worker name" style={I}/>
                </div>}
                <div style={{gridColumn:'1/-1'}}>
                  <label style={L}>Notes</label>
                  <input value={p.notes} onChange={e=>up(p.id,{notes:e.target.value})} placeholder="Any special remarks..." style={I}/>
                </div>
              </div>

              {p.validation!=='idle'&&<div style={{marginTop:12,padding:'7px 12px',borderRadius:8,fontSize:11,
                background:p.validation==='valid'?'rgba(0,212,170,0.08)':p.validation==='invalid'?'rgba(255,85,85,0.08)':p.validation==='checking'?'rgba(30,136,229,0.08)':'rgba(255,167,38,0.08)',
                color:p.validation==='valid'?'#00d4aa':p.validation==='invalid'?'#ff7777':p.validation==='checking'?'#64b5f6':'#ffa726'}}>
                {p.validation==='checking'?'⚡ Verifying 6-month eligibility...':p.validation==='valid'?`✓ ${p.validation_msg}`:p.validation==='invalid'?`✗ ${p.validation_msg}`:`⚠ ${p.validation_msg}`}
              </div>}
            </motion.div>);
          })}

          <AnimatePresence>
            {pilgrims.length>0&&<motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} style={{...C,display:'flex',alignItems:'center',gap:12,border:allReady?'1px solid rgba(0,212,170,0.3)':'1px solid rgba(255,255,255,0.08)',marginBottom:24}}>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:700,color:'#f0f4ff'}}>
                  {pilgrims.filter(p=>p.validation==='valid').length} of {pilgrims.length} verified
                </div>
                {!visitDate&&<div style={{fontSize:10,color:'#ffa726',marginTop:2}}>Select visit date above</div>}
                {hasInvalid&&<div style={{fontSize:10,color:'#ff7777',marginTop:2}}>Remove ineligible pilgrims first</div>}
                {hasChecking&&<div style={{fontSize:10,color:'#64b5f6',marginTop:2}}>Waiting for verification...</div>}
                {!hasInvalid&&!hasChecking&&allNamed&&visitDate&&pilgrims.some(p=>p.validation==='idle')&&(
                  <div style={{fontSize:10,color:'#ffa726',marginTop:2}}>
                    {allAadhaarFilled&&allPhoneFilled?'Click Check to verify eligibility':'Fill Aadhaar + Phone to verify'}
                  </div>
                )}
                {allReady&&pilgrims.every(p=>p.validation==='valid')&&<div style={{fontSize:10,color:'#00d4aa',marginTop:2}}>All pilgrims verified ✓</div>}
              </div>
              <button onClick={submit} disabled={!allReady||submitting||quota.remaining===0}
                style={{...BTN,opacity:(!allReady||quota.remaining===0)?0.4:1}}>
                {submitting?<><Loader2 size={12} style={{animation:'spin 1s linear infinite'}}/>Submitting...</>:<><Send size={12}/>Submit for Approval</>}
              </button>
            </motion.div>}
          </AnimatePresence>
        </>}
      </div>

      {/* COL 3: FEED + APPROVAL */}
      <div style={{display:'flex',flexDirection:'column',gap:12,overflow:'auto'}}>
        {approvalMsg&&<motion.div initial={{opacity:0}} animate={{opacity:1}} style={{padding:'10px 14px',borderRadius:10,fontSize:12,fontWeight:600,background:approvalMsg.includes('Error')?'rgba(255,85,85,0.1)':'rgba(0,212,170,0.1)',border:`1px solid ${approvalMsg.includes('Error')?'rgba(255,85,85,0.2)':'rgba(0,212,170,0.2)'}`,color:approvalMsg.includes('Error')?'#ff7777':'#00d4aa'}}>{approvalMsg}</motion.div>}

        {selectedGroup?(
          <motion.div initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} style={{...C,border:'1px solid rgba(0,212,170,0.2)'}}>
            <div style={{fontSize:12,fontWeight:700,color:'#f0f4ff',marginBottom:8}}>Approve Booking</div>
            <div style={{fontSize:10,color:'#00d4aa',fontFamily:'monospace',marginBottom:12}}>{selectedGroup.ref}</div>
            {selectedGroup.pilgrims.map((p,i)=><div key={i} style={{padding:'5px 0',borderBottom:'1px solid rgba(255,255,255,0.04)',fontSize:11}}>
              <div style={{color:'#f0f4ff',fontWeight:600}}>{p.full_name}</div>
              <div style={{color:'#8899bb',fontSize:10}}>{p.darshan_type} · ****{p.aadhaar_last4}{p.mandal?` · ${p.mandal}`:''}</div>
            </div>)}
            <div style={{marginTop:14}}>
              {[{k:'contact_person',l:'Contact Person *',ph:'Name'},{k:'contact_phone',l:'Contact Phone *',ph:'10-digit'},{k:'pickup_point',l:'Pickup Point',ph:'TTD office'},{k:'shrine_contacts',l:'Helpline',ph:'155257'}].map(({k,l,ph})=>(
                <div key={k} style={{marginBottom:10}}>
                  <label style={L}>{l}</label>
                  <input value={(approvalForm as any)[k]} onChange={e=>setApprovalForm(f=>({...f,[k]:e.target.value}))} placeholder={ph} style={I}/>
                </div>
              ))}
              <div style={{display:'flex',gap:8,marginTop:14}}>
                <button onClick={()=>setSelectedGroup(null)} style={{flex:1,padding:'8px',borderRadius:9,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.09)',color:'#8899bb',fontSize:11,fontWeight:600,cursor:'pointer'}}>Cancel</button>
                <button onClick={approve} disabled={approving||!approvalForm.contact_person} style={{...BTN,flex:2,justifyContent:'center',opacity:approving?0.7:1}}>
                  {approving?<><Loader2 size={12} style={{animation:'spin 1s linear infinite'}}/>Sending...</>:<><Send size={12}/>Approve & SMS</>}
                </button>
              </div>
            </div>
          </motion.div>
        ):(
          <>
            <div style={C}>
              <div style={{fontSize:12,fontWeight:700,color:'#f0f4ff',marginBottom:2}}>Validation Feed</div>
              <div style={{fontSize:10,color:'#8899bb'}}>Live Aadhaar eligibility checks</div>
            </div>
            <div style={{...C,flex:1}}>
              {feed.length===0?<div style={{textAlign:'center',padding:'20px 0'}}><Users size={22} style={{color:'#8899bb',opacity:0.25,margin:'0 auto 8px'}}/><div style={{fontSize:10,color:'#8899bb'}}>Enter Aadhaar + Phone to see results</div></div>
              :feed.map(f=><motion.div key={f.id} initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} style={{padding:'7px 0',borderBottom:'1px solid rgba(255,255,255,0.04)',display:'flex',alignItems:'flex-start',gap:8,fontSize:11}}>
                <span style={{width:7,height:7,borderRadius:'50%',background:f.color,flexShrink:0,marginTop:3}}/>
                <span style={{color:'#d0d8ee',lineHeight:1.4}}>{f.text}</span>
              </motion.div>)}
            </div>
            {groups.length>0&&(()=>{
              const all=groups.flatMap(g=>g.pilgrims);
              const workers=all.filter(p=>p.party_connection==='party_worker').length;
              const voters=all.filter(p=>p.party_connection==='voter').length;
              const mandals=[...new Set(all.map(p=>p.mandal).filter(Boolean))];
              return (<div style={C}>
                <div style={{fontSize:10,fontWeight:700,color:'#8899bb',textTransform:'uppercase',letterSpacing:0.8,marginBottom:10}}>Today's Intel</div>
                <div style={{display:'grid',gridTemplateColumns:isMob(w)?'1fr':'1fr 1fr',gap:8}}>
                  <div style={{background:'rgba(0,200,100,0.06)',border:'1px solid rgba(0,200,100,0.12)',borderRadius:8,padding:'8px 10px'}}>
                    <div style={{fontSize:18,fontWeight:800,color:'#00c864',fontFamily:'Space Grotesk'}}>{workers}</div>
                    <div style={{fontSize:9,color:'#8899bb'}}>Party workers</div>
                  </div>
                  <div style={{background:'rgba(30,136,229,0.06)',border:'1px solid rgba(30,136,229,0.12)',borderRadius:8,padding:'8px 10px'}}>
                    <div style={{fontSize:18,fontWeight:800,color:'#42a5f5',fontFamily:'Space Grotesk'}}>{voters}</div>
                    <div style={{fontSize:9,color:'#8899bb'}}>Voters/supporters</div>
                  </div>
                  <div style={{gridColumn:'1/-1',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:8,padding:'8px 10px'}}>
                    <div style={{fontSize:9,color:'#8899bb',marginBottom:4}}>Mandals reached today</div>
                    <div style={{fontSize:11,color:'#f0f4ff',fontWeight:600}}>{mandals.length>0?mandals.join(', '):'—'}</div>
                  </div>
                </div>
              </div>);
            })()}
          </>
        )}
      </div>
    </div>
  );
}
