import { useState, useEffect, useRef } from "react";
import {
  Calendar, List, CheckSquare, FileText, Clock,
  ChevronLeft, ChevronRight, Plus, Trash2, Save,
  Download, Upload, Check, AlertCircle, BookOpen
} from "lucide-react";

// ═══════════════════ Utilities ═══════════════════

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const getISOWeek = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const w1 = new Date(d.getFullYear(), 0, 4);
  return d.getFullYear() + "-W" + String(
    1 + Math.round(((d - w1) / 86400000 - 3 + ((w1.getDay() + 6) % 7)) / 7)
  ).padStart(2, "0");
};

const changeWeek = (ws, delta) => {
  const [y, w] = ws.split("-W").map(Number);
  const d = new Date(y, 0, 4);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() + (day <= 4 ? -day + 1 : 8 - day) + (w - 1 + delta) * 7);
  return getISOWeek(d);
};

const fmtWeek = (ws) => {
  const [y, w] = ws.split("-W");
  return `${y}年 第${w}周`;
};

const cnMonth = (m) => ["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"][m];

const LS_KEY = "personal_workstation_v1";

// ═══════════════════ Sample Data ═══════════════════

const SAMPLE_TODOS = [
  { id: "t1", text: "提交交建HR项目阶段验收报告", date: todayStr(), done: false, priority: "high" },
  { id: "t2", text: "准备周会汇报材料", date: todayStr(), done: true, priority: "medium" },
  { id: "t3", text: "跟进s-HR系统接口联调进度", date: todayStr(), done: false, priority: "normal" },
];

const SAMPLE_DAILY = [
  {
    id: "d1", date: todayStr(), project: "交建HR项目",
    items: [
      "完成组织模块接口文档评审，确认12个接口字段映射",
      "与开发团队对齐同步监控方案，约定下周一联调",
    ],
    issues: "客户方项目经理本周请假，需求确认延后",
  },
];

const SAMPLE_WEEKLY = [
  {
    id: "w1", week: getISOWeek(new Date()), project: "交建HR项目",
    completed: [
      "组织管理模块接口文档定稿（12个接口）",
      "员工主数据同步方案通过技术评审",
      "基础资料映射表维护功能上线测试环境",
    ],
    planned: [
      "启动员工类接口联调",
      "字典映射模块需求细化",
      "同步监控面板UI开发",
    ],
    risks: "客户方项目经理下周继续请假，可能影响需求确认节奏",
  },
];

// ═══════════════════ Component ═══════════════════

export default function PersonalWorkstation() {
  const [page, setPage] = useState("schedule");
  const fileRef = useRef(null);

  // ——— Schedule ———
  const [todos, setTodos] = useState(SAMPLE_TODOS);
  const [newTodo, setNewTodo] = useState("");
  const [newDate, setNewDate] = useState(todayStr());
  const [newPri, setNewPri] = useState("normal");
  const [checkins, setCheckins] = useState({});
  const [calDate, setCalDate] = useState(new Date());
  const [view, setView] = useState("list");

  // ——— Daily ———
  const [dailys, setDailys] = useState(SAMPLE_DAILY);
  const [dd, setDd] = useState({ date: todayStr(), project: "", items: "", issues: "" });

  // ——— Weekly ———
  const [weeklys, setWeeklys] = useState(SAMPLE_WEEKLY);
  const [selWeek, setSelWeek] = useState(getISOWeek(new Date()));
  const [wd, setWd] = useState({ project: "", completed: "", planned: "", risks: "" });

  // ——— Persistence ———
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.todos) setTodos(d.todos);
        if (d.checkins) setCheckins(d.checkins);
        if (d.dailys) setDailys(d.dailys);
        if (d.weeklys) setWeeklys(d.weeklys);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ todos, checkins, dailys, weeklys }));
    } catch (_) {}
  }, [todos, checkins, dailys, weeklys]);

  // ——— Todo Handlers ———
  const toggleTodo = (id) => setTodos(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const removeTodo = (id) => setTodos(ts => ts.filter(t => t.id !== id));
  const addTodo = () => {
    if (!newTodo.trim()) return;
    setTodos(ts => [...ts, { id: "t" + Date.now(), text: newTodo.trim(), date: newDate, done: false, priority: newPri }]);
    setNewTodo("");
  };
  const todayTodos = todos.filter(t => t.date === todayStr());
  const doneC = todayTodos.filter(t => t.done).length;

  // ——— Checkin ———
  const doCheckin = () => {
    const t = todayStr();
    setCheckins(c => ({ ...c, [t]: !c[t] }));
  };

  // ——— Daily Handlers ———
  const saveDaily = () => {
    if (!dd.project.trim() && !dd.items.trim()) return;
    const eid = dd.id || "d" + Date.now();
    setDailys(rs => {
      const idx = rs.findIndex(r => r.id === eid);
      const entry = { id: eid, date: dd.date, project: dd.project, items: dd.items.split("\n").filter(l => l.trim()), issues: dd.issues };
      if (idx >= 0) { const n = [...rs]; n[idx] = entry; return n; }
      return [entry, ...rs];
    });
    setDd({ date: todayStr(), project: "", items: "", issues: "" });
  };
  const editDaily = (r) => setDd({ id: r.id, date: r.date, project: r.project, items: r.items.join("\n"), issues: r.issues || "" });
  const removeDaily = (id) => setDailys(rs => rs.filter(r => r.id !== id));

  // ——— Weekly Handlers ———
  const saveWeekly = () => {
    if (!wd.project.trim()) return;
    const eid = wd.id || "w" + Date.now();
    setWeeklys(rs => {
      const idx = rs.findIndex(r => r.id === eid);
      const entry = {
        id: eid, week: selWeek, project: wd.project,
        completed: wd.completed.split("\n").filter(l => l.trim()),
        planned: wd.planned.split("\n").filter(l => l.trim()),
        risks: wd.risks,
      };
      if (idx >= 0) { const n = [...rs]; n[idx] = entry; return n; }
      return [entry, ...rs];
    });
    setWd({ project: "", completed: "", planned: "", risks: "" });
  };
  const editWeekly = (r) => setWd({ id: r.id, project: r.project, completed: r.completed.join("\n"), planned: r.planned.join("\n"), risks: r.risks || "" });
  const removeWeekly = (id) => setWeeklys(rs => rs.filter(r => r.id !== id));

  // ——— Export / Import ———
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ todos, checkins, dailys, weeklys }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `工作台备份_${todayStr()}.json`;
    a.click();
  };

  const importData = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const d = JSON.parse(ev.target.result);
        if (d.todos) setTodos(d.todos);
        if (d.checkins) setCheckins(d.checkins);
        if (d.dailys) setDailys(d.dailys);
        if (d.weeklys) setWeeklys(d.weeklys);
      } catch (_) { alert("文件格式错误，请选择JSON备份文件"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ——— Calendar Computed ———
  const yr = calDate.getFullYear();
  const mo = calDate.getMonth();
  const firstDow = new Date(yr, mo, 1).getDay();
  const dim = new Date(yr, mo + 1, 0).getDate();
  const prevDim = new Date(yr, mo, 0).getDate();
  const calDays = [];
  for (let i = firstDow - 1; i >= 0; i--) calDays.push({ d: prevDim - i, cur: false });
  for (let i = 1; i <= dim; i++) calDays.push({ d: i, cur: true, date: `${yr}-${String(mo + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}` });
  const rem = (7 - calDays.length % 7) % 7;
  for (let i = 1; i <= rem; i++) calDays.push({ d: i, cur: false });

  const weekReps = weeklys.filter(r => r.week === selWeek);

  // ═══════════════════ Render ═══════════════════

  const NAV = [
    { key: "schedule", icon: Calendar, label: "日程管理" },
    { key: "daily", icon: FileText, label: "工作日报" },
    { key: "weekly", icon: BookOpen, label: "项目周报" },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* ═══════ Sidebar ═══════ */}
      <aside className="w-56 text-white flex flex-col flex-shrink-0" style={{ background: "linear-gradient(180deg, #1a1f36 0%, #252b48 100%)" }}>
        <div className="px-5 py-6">
          <h1 className="text-lg font-bold tracking-wide">个人工作台</h1>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>{todayStr()} {new Date().toLocaleDateString("zh-CN", { weekday: "long" })}</p>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {NAV.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setPage(key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-150 ${
                page === key
                  ? "text-white shadow-lg"
                  : "text-gray-400 hover:bg-white hover:bg-opacity-10 hover:text-gray-200"
              }`}
              style={page === key ? { background: "rgba(99,102,241,0.35)" } : {}}
            >
              <Icon size={18} />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <button onClick={exportData} className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-xs text-gray-400 hover:bg-white hover:bg-opacity-10 transition-colors">
            <Download size={14} /> 导出数据
          </button>
          <button onClick={() => fileRef.current?.click()} className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-xs text-gray-400 hover:bg-white hover:bg-opacity-10 transition-colors mt-1">
            <Upload size={14} /> 导入数据
          </button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={importData} />
        </div>
      </aside>

      {/* ═══════ Main ═══════ */}
      <main className="flex-1 overflow-y-auto p-8">

        {/* ──────── SCHEDULE ──────── */}
        {page === "schedule" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">日程管理</h2>
                <p className="text-sm text-gray-400 mt-1">管理待办事项，记录每日打卡</p>
              </div>
              <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100">
                <button onClick={() => setView("list")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${view === "list" ? "bg-indigo-500 text-white shadow" : "text-gray-500"}`}>
                  <List size={15} /> 列表
                </button>
                <button onClick={() => setView("calendar")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${view === "calendar" ? "bg-indigo-500 text-white shadow" : "text-gray-500"}`}>
                  <Calendar size={15} /> 日历
                </button>
              </div>
            </div>

            <div className="flex gap-6" style={{ minHeight: 0 }}>
              {/* Left: todo list or calendar */}
              <div className={view === "list" ? "flex-1 min-w-0" : "flex-1 min-w-0"}>
                {view === "list" ? (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50">
                      <h3 className="font-semibold text-gray-700">今日待办</h3>
                      <p className="text-xs text-gray-400 mt-1">{todayStr()}</p>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {todayTodos.length === 0 ? (
                        <div className="px-5 py-12 text-center text-gray-300">
                          <CheckSquare size={36} className="mx-auto mb-3 opacity-30" />
                          <p className="text-sm">暂无待办事项</p>
                        </div>
                      ) : (
                        todayTodos.map(t => (
                          <div key={t.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors group">
                            <button onClick={() => toggleTodo(t.id)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${t.done ? "bg-emerald-500 border-emerald-500" : "border-gray-300 hover:border-indigo-400"}`}>
                              {t.done && <Check size={11} className="text-white" />}
                            </button>
                            <span className={`flex-1 text-sm ${t.done ? "line-through text-gray-300" : "text-gray-700"}`}>{t.text}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                              t.priority === "high" ? "bg-red-50 text-red-500" : t.priority === "medium" ? "bg-amber-50 text-amber-500" : "bg-gray-50 text-gray-400"
                            }`}>
                              {t.priority === "high" ? "紧急" : t.priority === "medium" ? "一般" : "普通"}
                            </span>
                            <button onClick={() => removeTodo(t.id)} className="text-gray-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
                      <div className="flex gap-2">
                        <input
                          value={newTodo}
                          onChange={e => setNewTodo(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && addTodo()}
                          placeholder="添加新待办..."
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-indigo-300 bg-white"
                        />
                        <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="px-2 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none" />
                        <select value={newPri} onChange={e => setNewPri(e.target.value)} className="px-2 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none">
                          <option value="normal">普通</option>
                          <option value="medium">一般</option>
                          <option value="high">紧急</option>
                        </select>
                        <button onClick={addTodo} className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600 transition-colors flex items-center gap-1 flex-shrink-0">
                          <Plus size={14} /> 添加
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-5">
                      <button onClick={() => setCalDate(new Date(yr, mo - 1))} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <ChevronLeft size={18} className="text-gray-400" />
                      </button>
                      <h3 className="text-lg font-semibold text-gray-700">{yr}年 {cnMonth(mo)}</h3>
                      <button onClick={() => setCalDate(new Date(yr, mo + 1))} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <ChevronRight size={18} className="text-gray-400" />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {["日","一","二","三","四","五","六"].map(d => (
                        <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {calDays.map((c, i) => {
                        const isT = c.date === todayStr();
                        const hasT = c.date && todos.some(t => t.date === c.date && !t.done);
                        return (
                          <div
                            key={i}
                            className={`relative text-center py-2.5 rounded-lg text-sm transition-all ${
                              !c.cur ? "text-gray-200" : isT ? "bg-indigo-500 text-white font-semibold shadow-sm" : "text-gray-600 hover:bg-gray-50 cursor-default"
                            }`}
                          >
                            {c.d}
                            {hasT && !isT && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-400 rounded-full" />}
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-400 flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-400 rounded-full inline-block" /> 有待办事项
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: stats + checkin */}
              <div className="w-72 flex-shrink-0 space-y-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h4 className="font-semibold text-gray-700 mb-4 text-sm">今日概览</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-indigo-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-indigo-600">{todayTodos.length}</p>
                      <p className="text-xs text-indigo-400 mt-1">总任务</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-emerald-600">{doneC}</p>
                      <p className="text-xs text-emerald-400 mt-1">已完成</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-amber-600">{todayTodos.length - doneC}</p>
                      <p className="text-xs text-amber-400 mt-1">进行中</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-purple-600">{todayTodos.length > 0 ? Math.round((doneC / todayTodos.length) * 100) : 0}%</p>
                      <p className="text-xs text-purple-400 mt-1">完成率</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h4 className="font-semibold text-gray-700 mb-3 text-sm">每日打卡</h4>
                  <button
                    onClick={doCheckin}
                    className={`w-full py-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      checkins[todayStr()]
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                        : "bg-gray-50 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200"
                    }`}
                  >
                    {checkins[todayStr()] ? (
                      <span className="flex items-center justify-center gap-2"><Check size={18} /> 今日已打卡</span>
                    ) : (
                      <span className="flex items-center justify-center gap-2"><Clock size={18} /> 点击打卡</span>
                    )}
                  </button>
                  <div className="mt-4">
                    <p className="text-xs text-gray-400 mb-2">本月打卡记录</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from({ length: dim }, (_, i) => {
                        const ds = `${yr}-${String(mo + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
                        const checked = checkins[ds];
                        const isToday = ds === todayStr();
                        return (
                          <div
                            key={i}
                            className={`w-7 h-7 rounded-md flex items-center justify-center text-xs transition-all ${
                              checked ? "bg-emerald-500 text-white" : isToday ? "border-2 border-indigo-400 text-indigo-500 font-semibold" : "bg-gray-50 text-gray-300"
                            }`}
                          >
                            {i + 1}
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      本月已打卡 <span className="text-emerald-500 font-semibold">{Object.values(checkins).filter(Boolean).length}</span> 天
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ──────── DAILY ──────── */}
        {page === "daily" && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">工作日报</h2>
              <p className="text-sm text-gray-400 mt-1">记录每日工作内容，按项目分类归档</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <h3 className="font-semibold text-gray-700 mb-4 text-sm flex items-center gap-2">
                <Save size={15} className="text-indigo-400" />
                {dd.id ? "编辑日报" : "新建日报"}
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">日期</label>
                  <input type="date" value={dd.date} onChange={e => setDd(d => ({ ...d, date: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-indigo-300" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">所属项目</label>
                  <input value={dd.project} onChange={e => setDd(d => ({ ...d, project: e.target.value }))} placeholder="例：交建HR项目" className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-indigo-300" />
                </div>
              </div>
              <div className="mb-4">
                <label className="text-xs text-gray-400 mb-1 block">工作内容（每行一条）</label>
                <textarea value={dd.items} onChange={e => setDd(d => ({ ...d, items: e.target.value }))} placeholder={"完成组织模块接口文档评审\n与开发团队对齐同步方案"} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm h-28 focus:outline-none focus:border-indigo-300 resize-none" />
              </div>
              <div className="mb-4">
                <label className="text-xs text-gray-400 mb-1 block">问题与风险</label>
                <textarea value={dd.issues} onChange={e => setDd(d => ({ ...d, issues: e.target.value }))} placeholder="记录当日遇到的问题或风险（可选）" className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm h-16 focus:outline-none focus:border-indigo-300 resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={saveDaily} className="px-5 py-2.5 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600 transition-colors flex items-center gap-2 font-medium">
                  <Save size={14} /> {dd.id ? "更新" : "保存"}
                </button>
                {dd.id && (
                  <button onClick={() => setDd({ date: todayStr(), project: "", items: "", issues: "" })} className="px-4 py-2.5 bg-gray-100 text-gray-500 rounded-lg text-sm hover:bg-gray-200 transition-colors">
                    取消编辑
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <h3 className="font-semibold text-gray-700 text-sm">历史记录</h3>
              </div>
              {dailys.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-300">
                  <FileText size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">暂无日报记录</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {dailys.map(r => (
                    <div key={r.id} className="px-6 py-5 hover:bg-gray-50 transition-colors group">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-xs text-gray-400">{r.date}</span>
                          <span className="ml-3 text-xs font-medium text-indigo-500 bg-indigo-50 px-2.5 py-0.5 rounded-full">{r.project}</span>
                        </div>
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => editDaily(r)} className="text-gray-300 hover:text-indigo-500 transition-colors"><FileText size={14} /></button>
                          <button onClick={() => removeDaily(r.id)} className="text-gray-300 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <ul className="space-y-1 mb-2">
                        {r.items.map((item, i) => (
                          <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="text-indigo-300 mt-1.5 flex-shrink-0">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                      {r.issues && (
                        <p className="text-xs text-amber-500 flex items-center gap-1.5 bg-amber-50 px-3 py-2 rounded-lg mt-2">
                          <AlertCircle size={13} className="flex-shrink-0" /> {r.issues}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ──────── WEEKLY ──────── */}
        {page === "weekly" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">项目周报</h2>
                <p className="text-sm text-gray-400 mt-1">按项目分类记录每周进展与计划</p>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
                <button onClick={() => setSelWeek(changeWeek(selWeek, -1))} className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <ChevronLeft size={16} className="text-gray-400" />
                </button>
                <span className="text-sm font-semibold text-gray-700 px-3 min-w-32 text-center">{fmtWeek(selWeek)}</span>
                <button onClick={() => setSelWeek(changeWeek(selWeek, 1))} className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <ChevronRight size={16} className="text-gray-400" />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <h3 className="font-semibold text-gray-700 mb-4 text-sm flex items-center gap-2">
                <Save size={15} className="text-indigo-400" />
                {wd.id ? "编辑周报" : "新建周报"} — {fmtWeek(selWeek)}
              </h3>
              <div className="mb-4">
                <label className="text-xs text-gray-400 mb-1 block">所属项目</label>
                <input value={wd.project} onChange={e => setWd(d => ({ ...d, project: e.target.value }))} placeholder="例：交建HR项目" className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-indigo-300" />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">本周完成（每行一条）</label>
                  <textarea value={wd.completed} onChange={e => setWd(d => ({ ...d, completed: e.target.value }))} placeholder={"完成接口文档定稿\n通过技术评审"} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm h-24 focus:outline-none focus:border-indigo-300 resize-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">下周计划（每行一条）</label>
                  <textarea value={wd.planned} onChange={e => setWd(d => ({ ...d, planned: e.target.value }))} placeholder={"启动接口联调\n需求细化"} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm h-24 focus:outline-none focus:border-indigo-300 resize-none" />
                </div>
              </div>
              <div className="mb-4">
                <label className="text-xs text-gray-400 mb-1 block">风险与问题</label>
                <textarea value={wd.risks} onChange={e => setWd(d => ({ ...d, risks: e.target.value }))} placeholder="记录本周风险或需要协调的事项（可选）" className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm h-16 focus:outline-none focus:border-indigo-300 resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={saveWeekly} className="px-5 py-2.5 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600 transition-colors flex items-center gap-2 font-medium">
                  <Save size={14} /> {wd.id ? "更新" : "保存"}
                </button>
                {wd.id && (
                  <button onClick={() => setWd({ project: "", completed: "", planned: "", risks: "" })} className="px-4 py-2.5 bg-gray-100 text-gray-500 rounded-lg text-sm hover:bg-gray-200 transition-colors">
                    取消编辑
                  </button>
                )}
              </div>
            </div>

            {weekReps.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-12 text-center text-gray-300">
                <BookOpen size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">{fmtWeek(selWeek)} 暂无周报记录</p>
              </div>
            ) : (
              <div className="space-y-4">
                {weekReps.map(r => (
                  <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <BookOpen size={16} className="text-indigo-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{r.project}</h4>
                          <p className="text-xs text-gray-400">{fmtWeek(r.week)}</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => editWeekly(r)} className="text-gray-300 hover:text-indigo-500 transition-colors"><FileText size={14} /></button>
                        <button onClick={() => removeWeekly(r.id)} className="text-gray-300 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs font-medium text-emerald-500 mb-2 flex items-center gap-1"><Check size={12} /> 本周完成</p>
                        <ul className="space-y-1.5">
                          {r.completed.map((item, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-emerald-300 mt-1.5 flex-shrink-0">•</span><span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-blue-500 mb-2 flex items-center gap-1"><Clock size={12} /> 下周计划</p>
                        <ul className="space-y-1.5">
                          {r.planned.map((item, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-blue-300 mt-1.5 flex-shrink-0">•</span><span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    {r.risks && (
                      <p className="text-xs text-amber-500 flex items-center gap-1.5 bg-amber-50 px-3 py-2 rounded-lg">
                        <AlertCircle size={13} className="flex-shrink-0" /> {r.risks}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ──────── Footer ──────── */}
        <div className="mt-8 pt-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-300">个人工作台 · 数据自动保存于本地浏览器 · 支持导出JSON备份</p>
        </div>
      </main>
    </div>
  );
}
