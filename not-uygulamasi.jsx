import { useState, useEffect, useRef } from "react";

const COLORS = ["#F5E6D3","#D3E8F5","#D3F5E1","#F5D3E8","#F5F0D3","#E8D3F5"];
const COLOR_DARK = ["#8B5E3C","#3C6B8B","#3C8B5A","#8B3C6B","#8B7A3C","#6B3C8B"];

function formatDate(d) {
  const now = new Date();
  const date = new Date(d);
  const diff = Math.floor((now - date) / 60000);
  if (diff < 1) return "şimdi";
  if (diff < 60) return `${diff}dk önce`;
  if (diff < 1440) return `${Math.floor(diff/60)}sa önce`;
  return date.toLocaleDateString("tr-TR", { day:"numeric", month:"short" });
}

function formatTaskDate(d) {
  if (!d) return "";
  const date = new Date(d + "T00:00:00");
  const now = new Date();
  now.setHours(0,0,0,0);
  const diff = Math.floor((date - now) / 86400000);
  if (diff < 0) return { label: `${Math.abs(diff)}g geçti`, warn: true };
  if (diff === 0) return { label: "bugün", urgent: true };
  if (diff === 1) return { label: "yarın", soon: true };
  return { label: date.toLocaleDateString("tr-TR", { day:"numeric", month:"short" }) };
}

export default function App() {
  const [tab, setTab] = useState("notes");
  const [notes, setNotes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const [noteView, setNoteView] = useState("list");
  const [editNote, setEditNote] = useState(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [noteColor, setNoteColor] = useState(0);
  const [notePinned, setNotePinned] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  const [taskView, setTaskView] = useState("list");
  const [editTask, setEditTask] = useState(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDate, setTaskDate] = useState("");
  const [taskPriority, setTaskPriority] = useState("normal");
  const [taskNote, setTaskNote] = useState("");
  const [taskFilter, setTaskFilter] = useState("all");

  useEffect(() => {
    async function load() {
      try {
        const n = await window.storage.get("notes_v1");
        if (n) setNotes(JSON.parse(n.value));
      } catch {}
      try {
        const t = await window.storage.get("tasks_v1");
        if (t) setTasks(JSON.parse(t.value));
      } catch {}
      setLoaded(true);
    }
    load();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.storage.set("notes_v1", JSON.stringify(notes)).catch(()=>{});
  }, [notes, loaded]);

  useEffect(() => {
    if (!loaded) return;
    window.storage.set("tasks_v1", JSON.stringify(tasks)).catch(()=>{});
  }, [tasks, loaded]);

  function openNewNote() {
    setEditNote(null);
    setNoteTitle(""); setNoteBody(""); setNoteColor(0); setNotePinned(false);
    setNoteView("edit");
  }

  function openEditNote(n) {
    setEditNote(n.id);
    setNoteTitle(n.title); setNoteBody(n.body); setNoteColor(n.color||0); setNotePinned(n.pinned||false);
    setNoteView("edit");
  }

  function saveNote() {
    if (!noteTitle.trim() && !noteBody.trim()) { setNoteView("list"); return; }
    if (editNote) {
      setNotes(ns => ns.map(n => n.id===editNote ? {...n, title:noteTitle, body:noteBody, color:noteColor, pinned:notePinned, updatedAt:Date.now()} : n));
    } else {
      setNotes(ns => [{id:Date.now(), title:noteTitle, body:noteBody, color:noteColor, pinned:notePinned, createdAt:Date.now(), updatedAt:Date.now()}, ...ns]);
    }
    setNoteView("list");
  }

  function deleteNote(id) {
    setNotes(ns => ns.filter(n => n.id !== id));
    setNoteView("list");
  }

  function openNewTask() {
    setEditTask(null);
    setTaskTitle(""); setTaskDate(""); setTaskPriority("normal"); setTaskNote("");
    setTaskView("edit");
  }

  function openEditTask(t) {
    setEditTask(t.id);
    setTaskTitle(t.title); setTaskDate(t.date||""); setTaskPriority(t.priority||"normal"); setTaskNote(t.note||"");
    setTaskView("edit");
  }

  function saveTask() {
    if (!taskTitle.trim()) { setTaskView("list"); return; }
    if (editTask) {
      setTasks(ts => ts.map(t => t.id===editTask ? {...t, title:taskTitle, date:taskDate, priority:taskPriority, note:taskNote} : t));
    } else {
      setTasks(ts => [...ts, {id:Date.now(), title:taskTitle, date:taskDate, priority:taskPriority, note:taskNote, done:false, createdAt:Date.now()}]);
    }
    setTaskView("list");
  }

  function toggleDone(id) {
    setTasks(ts => ts.map(t => t.id===id ? {...t, done:!t.done, doneAt: !t.done ? Date.now() : null} : t));
  }

  function deleteTask(id) {
    setTasks(ts => ts.filter(t => t.id !== id));
    setTaskView("list");
  }

  const filteredNotes = notes
    .filter(n => !searchQ || n.title.toLowerCase().includes(searchQ.toLowerCase()) || n.body.toLowerCase().includes(searchQ.toLowerCase()))
    .sort((a,b) => (b.pinned?1:0)-(a.pinned?1:0) || b.updatedAt-a.updatedAt);

  const filteredTasks = tasks.filter(t => {
    if (taskFilter==="active") return !t.done;
    if (taskFilter==="done") return t.done;
    return true;
  }).sort((a,b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const pa = a.priority==="high"?0:a.priority==="normal"?1:2;
    const pb = b.priority==="high"?0:b.priority==="normal"?1:2;
    if (pa!==pb) return pa-pb;
    if (a.date && b.date) return new Date(a.date)-new Date(b.date);
    return b.createdAt-a.createdAt;
  });

  const doneCnt = tasks.filter(t=>t.done).length;
  const activeCnt = tasks.filter(t=>!t.done).length;

  const s = styles;

  if (!loaded) return <div style={s.loading}>yükleniyor…</div>;

  return (
    <div style={s.app}>
      <h2 className="sr-only">Not ve plan uygulaması</h2>

      {/* HEADER */}
      <div style={s.header}>
        <div style={s.headerInner}>
          <span style={s.logo}>✦ notpas</span>
          <div style={s.headerStats}>
            {tab==="notes" ? <span style={s.statBadge}>{notes.length} not</span>
              : <span style={s.statBadge}>{activeCnt} bekliyor</span>}
          </div>
        </div>
      </div>

      {/* TAB BAR */}
      <div style={s.tabBar}>
        <button style={{...s.tabBtn, ...(tab==="notes"?s.tabActive:{})}} onClick={()=>{setTab("notes");setNoteView("list");}}>
          <i className="ti ti-notes" aria-hidden="true" style={s.tabIcon}></i>
          <span>Notlar</span>
        </button>
        <button style={{...s.tabBtn, ...(tab==="tasks"?s.tabActive:{})}} onClick={()=>{setTab("tasks");setTaskView("list");}}>
          <i className="ti ti-checklist" aria-hidden="true" style={s.tabIcon}></i>
          <span>Planlar</span>
        </button>
      </div>

      {/* CONTENT */}
      <div style={s.content}>
        {/* ===== NOTES ===== */}
        {tab==="notes" && noteView==="list" && (
          <div>
            <div style={s.toolbar}>
              <div style={s.searchWrap}>
                <i className="ti ti-search" aria-hidden="true" style={s.searchIcon}></i>
                <input style={s.searchInput} placeholder="Notlarda ara…" value={searchQ} onChange={e=>setSearchQ(e.target.value)} />
                {searchQ && <button style={s.searchClear} onClick={()=>setSearchQ("")}><i className="ti ti-x" aria-hidden="true"></i></button>}
              </div>
            </div>

            {filteredNotes.length===0 && (
              <div style={s.empty}>
                <i className="ti ti-notes" style={s.emptyIcon} aria-hidden="true"></i>
                <p style={s.emptyText}>{searchQ ? "Sonuç bulunamadı" : "Henüz not yok"}</p>
                {!searchQ && <p style={s.emptyHint}>+ butonuna tıkla, ilk notunu ekle</p>}
              </div>
            )}

            <div style={s.noteGrid}>
              {filteredNotes.map(n => (
                <div key={n.id} style={{...s.noteCard, background: COLORS[n.color||0]}} onClick={()=>openEditNote(n)}>
                  <div style={s.noteCardTop}>
                    {n.pinned && <i className="ti ti-pin-filled" aria-hidden="true" style={{fontSize:13, color: COLOR_DARK[n.color||0]}}></i>}
                    <span style={{...s.noteTime, color: COLOR_DARK[n.color||0]}}>{formatDate(n.updatedAt)}</span>
                  </div>
                  {n.title && <p style={{...s.noteCardTitle, color: COLOR_DARK[n.color||0]}}>{n.title}</p>}
                  {n.body && <p style={{...s.noteCardBody, color: COLOR_DARK[n.color||0]}}>{n.body.slice(0,120)}{n.body.length>120?"…":""}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==="notes" && noteView==="edit" && (
          <div style={s.editPane}>
            <div style={s.editTop}>
              <button style={s.backBtn} onClick={saveNote}>
                <i className="ti ti-arrow-left" aria-hidden="true"></i> kaydet
              </button>
              <div style={s.editActions}>
                <button style={{...s.iconBtn, color: notePinned?"#c0621c":"var(--color-text-secondary)"}} onClick={()=>setNotePinned(p=>!p)} aria-label="sabitle">
                  <i className={`ti ti-pin${notePinned?"-filled":""}`} aria-hidden="true"></i>
                </button>
                {editNote && <button style={{...s.iconBtn, color:"#c0392b"}} onClick={()=>deleteNote(editNote)} aria-label="sil">
                  <i className="ti ti-trash" aria-hidden="true"></i>
                </button>}
              </div>
            </div>

            <div style={{...s.editCard, background: COLORS[noteColor]}}>
              <input style={{...s.titleInput, color: COLOR_DARK[noteColor]}} placeholder="Başlık…" value={noteTitle} onChange={e=>setNoteTitle(e.target.value)} />
              <div style={{...s.divider, borderColor: COLOR_DARK[noteColor]+"44"}}></div>
              <textarea style={{...s.bodyInput, color: COLOR_DARK[noteColor]}} placeholder="Notunu buraya yaz…" value={noteBody} onChange={e=>setNoteBody(e.target.value)} rows={12} />
            </div>

            <div style={s.colorRow}>
              {COLORS.map((c,i) => (
                <button key={i} style={{...s.colorDot, background:c, border: noteColor===i?`2px solid ${COLOR_DARK[i]}`:"2px solid transparent"}} onClick={()=>setNoteColor(i)} aria-label={`renk ${i+1}`}></button>
              ))}
            </div>
          </div>
        )}

        {/* ===== TASKS ===== */}
        {tab==="tasks" && taskView==="list" && (
          <div>
            {tasks.length > 0 && (
              <div style={s.progressBar}>
                <div style={s.progressTrack}>
                  <div style={{...s.progressFill, width: tasks.length ? `${Math.round(doneCnt/tasks.length*100)}%` : "0%"}}></div>
                </div>
                <span style={s.progressLabel}>{tasks.length ? Math.round(doneCnt/tasks.length*100) : 0}% tamamlandı</span>
              </div>
            )}

            <div style={s.filterRow}>
              {["all","active","done"].map(f => (
                <button key={f} style={{...s.filterBtn, ...(taskFilter===f?s.filterActive:{})}} onClick={()=>setTaskFilter(f)}>
                  {f==="all"?"tümü":f==="active"?"bekleyen":"tamamlanan"}
                </button>
              ))}
            </div>

            {filteredTasks.length===0 && (
              <div style={s.empty}>
                <i className="ti ti-checklist" style={s.emptyIcon} aria-hidden="true"></i>
                <p style={s.emptyText}>{taskFilter==="done" ? "Henüz tamamlanan yok" : taskFilter==="active" ? "Bekleyen görev yok" : "Henüz görev yok"}</p>
                {taskFilter!=="done" && <p style={s.emptyHint}>+ butonuna tıkla, ilk görevini ekle</p>}
              </div>
            )}

            <div style={s.taskList}>
              {filteredTasks.map(t => {
                const dl = formatTaskDate(t.date);
                const pColor = t.priority==="high"?"#c0392b":t.priority==="low"?"#27ae60":"#2980b9";
                return (
                  <div key={t.id} style={{...s.taskCard, opacity: t.done?0.65:1}}>
                    <button style={{...s.checkbox, ...(t.done?s.checkboxDone:{})}} onClick={()=>toggleDone(t.id)} aria-label={t.done?"geri al":"tamamla"}>
                      {t.done && <i className="ti ti-check" aria-hidden="true" style={{fontSize:14, color:"#fff"}}></i>}
                    </button>
                    <div style={s.taskInfo} onClick={()=>openEditTask(t)}>
                      <p style={{...s.taskTitle, textDecoration: t.done?"line-through":"none"}}>{t.title}</p>
                      <div style={s.taskMeta}>
                        <span style={{...s.priorityDot, background:pColor}}></span>
                        {t.date && dl && (
                          <span style={{...s.taskDateBadge, color: dl.warn?"#c0392b":dl.urgent?"#e67e22":dl.soon?"#27ae60":"var(--color-text-secondary)"}}>
                            <i className="ti ti-calendar" aria-hidden="true" style={{fontSize:12}}></i> {dl.label}
                          </span>
                        )}
                        {t.note && <span style={s.taskHasNote}><i className="ti ti-file-text" aria-hidden="true" style={{fontSize:12}}></i></span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab==="tasks" && taskView==="edit" && (
          <div style={s.editPane}>
            <div style={s.editTop}>
              <button style={s.backBtn} onClick={saveTask}>
                <i className="ti ti-arrow-left" aria-hidden="true"></i> kaydet
              </button>
              {editTask && <button style={{...s.iconBtn, color:"#c0392b"}} onClick={()=>deleteTask(editTask)} aria-label="sil">
                <i className="ti ti-trash" aria-hidden="true"></i>
              </button>}
            </div>

            <div style={s.taskForm}>
              <label style={s.formLabel}>Görev</label>
              <input style={s.formInput} placeholder="Ne yapacaksın?" value={taskTitle} onChange={e=>setTaskTitle(e.target.value)} />

              <label style={s.formLabel}>Tarih (isteğe bağlı)</label>
              <input type="date" style={s.formInput} value={taskDate} onChange={e=>setTaskDate(e.target.value)} />

              <label style={s.formLabel}>Öncelik</label>
              <div style={s.priorityRow}>
                {[["high","Yüksek","#c0392b"],["normal","Normal","#2980b9"],["low","Düşük","#27ae60"]].map(([v,l,c]) => (
                  <button key={v} style={{...s.priorityBtn, border: taskPriority===v?`2px solid ${c}`:"2px solid var(--color-border-tertiary)", color: taskPriority===v?c:"var(--color-text-secondary)"}} onClick={()=>setTaskPriority(v)}>
                    <span style={{...s.priorityDot, background:c}}></span> {l}
                  </button>
                ))}
              </div>

              <label style={s.formLabel}>Not (isteğe bağlı)</label>
              <textarea style={{...s.formInput, resize:"vertical"}} placeholder="Ek bilgi, detay…" value={taskNote} onChange={e=>setTaskNote(e.target.value)} rows={4} />
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      {((tab==="notes" && noteView==="list") || (tab==="tasks" && taskView==="list")) && (
        <button style={s.fab} onClick={tab==="notes"?openNewNote:openNewTask} aria-label={tab==="notes"?"yeni not":"yeni görev"}>
          <i className="ti ti-plus" aria-hidden="true" style={{fontSize:26}}></i>
        </button>
      )}
    </div>
  );
}

const styles = {
  app: { minHeight: "100vh", background: "var(--color-background-tertiary)", fontFamily: "var(--font-sans)", paddingBottom: 80, position:"relative" },
  loading: { padding: "2rem", textAlign:"center", color:"var(--color-text-secondary)" },
  header: { background: "var(--color-background-primary)", borderBottom: "0.5px solid var(--color-border-tertiary)", padding: "14px 16px 10px" },
  headerInner: { display:"flex", alignItems:"center", justifyContent:"space-between" },
  logo: { fontSize: 20, fontWeight: 600, letterSpacing: "-0.5px", color:"var(--color-text-primary)" },
  headerStats: { display:"flex", gap:8 },
  statBadge: { fontSize:12, background:"var(--color-background-secondary)", color:"var(--color-text-secondary)", padding:"3px 10px", borderRadius:20, border:"0.5px solid var(--color-border-tertiary)" },
  tabBar: { display:"flex", background:"var(--color-background-primary)", borderBottom:"0.5px solid var(--color-border-tertiary)" },
  tabBtn: { flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"10px 0", fontSize:14, color:"var(--color-text-secondary)", background:"transparent", border:"none", cursor:"pointer", borderBottom:"2px solid transparent" },
  tabActive: { color:"var(--color-text-primary)", borderBottom:"2px solid var(--color-text-primary)", fontWeight:500 },
  tabIcon: { fontSize:18 },
  content: { padding:"12px 12px 0" },
  toolbar: { marginBottom:10 },
  searchWrap: { position:"relative", display:"flex", alignItems:"center" },
  searchIcon: { position:"absolute", left:10, fontSize:16, color:"var(--color-text-secondary)", pointerEvents:"none" },
  searchInput: { width:"100%", padding:"8px 36px 8px 34px", borderRadius:10, border:"0.5px solid var(--color-border-tertiary)", background:"var(--color-background-primary)", fontSize:14, color:"var(--color-text-primary)", outline:"none", boxSizing:"border-box" },
  searchClear: { position:"absolute", right:8, background:"transparent", border:"none", cursor:"pointer", color:"var(--color-text-secondary)", fontSize:16, padding:2 },
  noteGrid: { display:"grid", gridTemplateColumns:"repeat(2, minmax(0,1fr))", gap:10 },
  noteCard: { borderRadius:12, padding:"12px 12px 10px", cursor:"pointer", minHeight:80 },
  noteCardTop: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 },
  noteTime: { fontSize:11 },
  noteCardTitle: { fontSize:14, fontWeight:500, margin:"0 0 4px", lineHeight:1.4 },
  noteCardBody: { fontSize:13, margin:0, lineHeight:1.5, opacity:0.85 },
  empty: { textAlign:"center", padding:"60px 20px 20px" },
  emptyIcon: { fontSize:48, color:"var(--color-text-secondary)", opacity:0.4 },
  emptyText: { fontSize:16, color:"var(--color-text-secondary)", margin:"12px 0 4px" },
  emptyHint: { fontSize:13, color:"var(--color-text-secondary)", opacity:0.7 },
  editPane: { paddingTop:4 },
  editTop: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 },
  backBtn: { display:"flex", alignItems:"center", gap:6, fontSize:15, color:"var(--color-text-primary)", background:"transparent", border:"none", cursor:"pointer", padding:"6px 0" },
  editActions: { display:"flex", gap:8 },
  iconBtn: { background:"transparent", border:"none", cursor:"pointer", fontSize:20, padding:"4px 6px", borderRadius:8 },
  editCard: { borderRadius:14, padding:"16px 16px 12px", marginBottom:12 },
  titleInput: { width:"100%", background:"transparent", border:"none", outline:"none", fontSize:18, fontWeight:600, margin:"0 0 8px", padding:0, boxSizing:"border-box" },
  divider: { borderTop:"0.5px solid", marginBottom:10 },
  bodyInput: { width:"100%", background:"transparent", border:"none", outline:"none", fontSize:15, lineHeight:1.6, resize:"none", padding:0, boxSizing:"border-box" },
  colorRow: { display:"flex", gap:10, justifyContent:"center", padding:"4px 0 8px" },
  colorDot: { width:28, height:28, borderRadius:"50%", cursor:"pointer", padding:0 },
  progressBar: { padding:"4px 0 8px", display:"flex", alignItems:"center", gap:10 },
  progressTrack: { flex:1, height:6, background:"var(--color-border-tertiary)", borderRadius:3, overflow:"hidden" },
  progressFill: { height:"100%", background:"#27ae60", borderRadius:3, transition:"width 0.3s" },
  progressLabel: { fontSize:12, color:"var(--color-text-secondary)", whiteSpace:"nowrap" },
  filterRow: { display:"flex", gap:6, marginBottom:12 },
  filterBtn: { fontSize:12, padding:"5px 12px", borderRadius:20, border:"0.5px solid var(--color-border-tertiary)", background:"var(--color-background-primary)", color:"var(--color-text-secondary)", cursor:"pointer" },
  filterActive: { background:"var(--color-text-primary)", color:"var(--color-background-primary)", border:"0.5px solid var(--color-text-primary)" },
  taskList: { display:"flex", flexDirection:"column", gap:8 },
  taskCard: { display:"flex", alignItems:"center", gap:12, background:"var(--color-background-primary)", borderRadius:12, padding:"12px 14px", border:"0.5px solid var(--color-border-tertiary)" },
  checkbox: { width:24, height:24, minWidth:24, borderRadius:8, border:"1.5px solid var(--color-border-secondary)", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" },
  checkboxDone: { background:"#27ae60", borderColor:"#27ae60" },
  taskInfo: { flex:1, cursor:"pointer", minWidth:0 },
  taskTitle: { fontSize:15, margin:"0 0 4px", color:"var(--color-text-primary)", lineHeight:1.4, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" },
  taskMeta: { display:"flex", alignItems:"center", gap:8 },
  priorityDot: { width:7, height:7, borderRadius:"50%", display:"inline-block" },
  taskDateBadge: { fontSize:12, display:"flex", alignItems:"center", gap:3 },
  taskHasNote: { color:"var(--color-text-secondary)", fontSize:12 },
  taskForm: { display:"flex", flexDirection:"column", gap:4 },
  formLabel: { fontSize:13, color:"var(--color-text-secondary)", marginTop:10, marginBottom:2 },
  formInput: { width:"100%", padding:"10px 12px", borderRadius:10, border:"0.5px solid var(--color-border-tertiary)", background:"var(--color-background-primary)", fontSize:15, color:"var(--color-text-primary)", outline:"none", boxSizing:"border-box" },
  priorityRow: { display:"flex", gap:8 },
  priorityBtn: { flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"8px 0", borderRadius:10, background:"transparent", cursor:"pointer", fontSize:13 },
  fab: { position:"fixed", bottom:24, right:20, width:54, height:54, borderRadius:"50%", background:"var(--color-text-primary)", color:"var(--color-background-primary)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 12px rgba(0,0,0,0.18)", zIndex:100 },
};
