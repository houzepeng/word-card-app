import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { 
  Sparkles, RefreshCw, Palette, Printer, Volume2, BookOpen, X, 
  Wand2, Gamepad2, Download, Edit3, Layers, Home, Menu
} from 'lucide-react';

// --- 样式定义组件 (修复 FontStyles 未定义错误) ---
const FontStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Zcool+KuaiLe&family=Fredoka+One&family=Noto+Sans+SC:wght@400;700&display=swap');
    
    :root {
      --app-bg: #fbf8f1;
      --card-bg: #ffffff;
      --primary: #6366f1;
    }

    body {
      background-color: var(--app-bg);
      overscroll-behavior-y: none; /* 防止手机下拉刷新 */
    }
    
    .font-hand { font-family: 'Patrick Hand', 'Zcool KuaiLe', cursive; }
    .font-title { font-family: 'Fredoka One', 'Zcool KuaiLe', cursive; }
    .font-pinyin { font-family: 'Noto Sans SC', sans-serif; }
    
    .bg-texture {
      background-color: #fbf8f1;
      background-image: radial-gradient(#e5e7eb 1px, transparent 1px);
      background-size: 20px 20px;
    }

    /* 移动端卡片样式优化 */
    .doodle-border {
      border: 3px solid #2d3436;
      border-radius: 20px;
      box-shadow: 4px 4px 0px 0px rgba(0,0,0,0.1);
      background-color: #fffcf5;
    }
    
    .doodle-box {
      border: 2px solid #2d3436;
      border-radius: 12px;
      box-shadow: 3px 3px 0px 0px #2d3436;
      transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      background: white;
      touch-action: manipulation;
    }

    .doodle-box:active {
      transform: scale(0.98);
      box-shadow: 1px 1px 0px 0px #2d3436;
    }

    /* 测验模式 */
    .quiz-active .doodle-box { 
      animation: pulse-border 2s infinite;
    }
    @keyframes pulse-border {
      0% { border-color: #2d3436; }
      50% { border-color: #6366f1; }
      100% { border-color: #2d3436; }
    }

    /* 填色模式 */
    .coloring-mode img { filter: grayscale(100%) contrast(120%) brightness(110%); }
    .coloring-mode .doodle-box { box-shadow: none; border: 2px solid black; }
    .coloring-mode .category-bg { opacity: 0 !important; }

    /* 编辑输入框 */
    .edit-input {
      background: rgba(243, 244, 246, 0.8);
      border: 1px solid #ccc;
      text-align: center;
      width: 100%;
      border-radius: 4px;
      padding: 2px 0;
    }

    .dashed-divider {
      background-image: linear-gradient(to right, #2d3436 50%, rgba(255,255,255,0) 0%);
      background-position: bottom;
      background-size: 12px 2px;
      background-repeat: repeat-x;
    }
    
    .text-stroke { -webkit-text-stroke: 1.5px #2d3436; text-shadow: 2px 2px 0px rgba(0,0,0,0.1); }
    
    @media print {
      .no-print { display: none !important; }
      .doodle-border { border: 2px solid #000; box-shadow: none; }
      .bottom-nav { display: none; }
    }
  `}</style>
);

// --- 初始数据 ---
const INITIAL_DATA = {
  topicEn: "Fruits",
  topicCn: "水果派对",
  categories: [
    {
      name: "Sweet",
      cnName: "甜甜的",
      color: "bg-pink-50",
      borderColor: "border-pink-200",
      items: [
        { en: "Apple", cn: "苹果", pinyin: "píng guǒ", emoji: "🍎" },
        { en: "Banana", cn: "香蕉", pinyin: "xiāng jiāo", emoji: "🍌" },
        { en: "Peach", cn: "桃子", pinyin: "táo zi", emoji: "🍑" },
        { en: "Grape", cn: "葡萄", pinyin: "pú tao", emoji: "🍇" },
      ]
    }
  ]
};

// --- 子组件: 底部导航栏 ---
const BottomNav = ({ activeTab, setActiveTab, onGenerateClick }) => {
  const tabs = [
    { id: 'home', icon: Home, label: '首页' },
    { id: 'quiz', icon: Gamepad2, label: '挑战' },
    { id: 'color', icon: Palette, label: '填色' },
    { id: 'menu', icon: Menu, label: '更多' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe px-6 py-2 flex justify-between items-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] no-print h-16 safe-area-bottom">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === tab.id ? 'text-indigo-600' : 'text-gray-400'}`}
        >
          <tab.icon size={24} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
          <span className="text-[10px] font-bold">{tab.label}</span>
        </button>
      ))}
      
      {/* 悬浮生成按钮 */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-6">
        <button 
          onClick={onGenerateClick}
          className="bg-indigo-600 text-white p-4 rounded-full shadow-lg border-4 border-white hover:scale-105 active:scale-95 transition-transform"
        >
          <Sparkles size={28} />
        </button>
      </div>
    </div>
  );
};

// --- 子组件: 卡片 ---
const Card = ({ 
  item, categoryIdx, itemIdx, 
  onGenerateImage, onGenerateSpeech, onGenerateSentence, 
  isQuizMode, onCardClick, coloringMode, editMode, onUpdateItem, customImageOverride 
}) => {
  const [loading, setLoading] = useState(false);
  const [customImage, setCustomImage] = useState(null);
  const [showSentence, setShowSentence] = useState(false);
  const [sentence, setSentence] = useState(null);

  useEffect(() => {
    if (customImageOverride) setCustomImage(customImageOverride);
  }, [customImageOverride]);

  const handleImageClick = async (e) => {
    e.stopPropagation();
    if (isQuizMode || editMode || coloringMode) {
      if (isQuizMode) onCardClick(item);
      return;
    }
    setLoading(true);
    try {
      const prompt = `icon design of a ${item.en}, thick bold black marker outlines, flat vector art style, simple shapes, kawaii cute face expression, pastel colors, sticker style with white border, isolated on white background, minimal details`;
      const url = await onGenerateImage(prompt);
      if (url) setCustomImage(url);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleAudioClick = async (e) => {
    e.stopPropagation();
    onGenerateSpeech(item.en);
  };

  const handleSentenceClick = async (e) => {
    e.stopPropagation();
    if (sentence) { setShowSentence(!showSentence); return; }
    const res = await onGenerateSentence(item.en, item.cn);
    setSentence(res);
    setShowSentence(true);
  };

  return (
    <div 
      onClick={() => isQuizMode && onCardClick(item)}
      className={`doodle-box relative p-2 flex flex-col items-center h-full justify-between ${isQuizMode ? 'active:bg-indigo-50 cursor-pointer' : ''}`}
    >
      {/* 功能按钮 */}
      {!isQuizMode && !editMode && !coloringMode && (
        <div className="absolute top-1 right-1 flex gap-1 z-10">
           <button onClick={handleAudioClick} className="p-1.5 rounded-full bg-indigo-50 text-indigo-500 active:bg-indigo-100 hover:bg-indigo-100 transition-colors">
             <Volume2 size={14} />
           </button>
           <button onClick={handleSentenceClick} className="p-1.5 rounded-full bg-pink-50 text-pink-500 active:bg-pink-100 hover:bg-pink-100 transition-colors">
             <BookOpen size={14} />
           </button>
        </div>
      )}

      {/* 图片区域 */}
      <div 
        onClick={handleImageClick}
        className="w-full aspect-square mb-1 flex items-center justify-center text-5xl md:text-6xl relative rounded-lg overflow-hidden active:scale-95 transition-transform cursor-pointer"
      >
        {loading ? (
           <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent"></div>
        ) : customImage ? (
          <img src={customImage} alt={item.en} className="w-full h-full object-contain drop-shadow-sm" />
        ) : (
          <span className="filter drop-shadow-sm">{item.emoji}</span>
        )}
        
        {!customImage && !loading && !isQuizMode && !editMode && !coloringMode && (
            <div className="absolute bottom-1 right-1 opacity-50">
                <Sparkles size={12} className="text-indigo-400" />
            </div>
        )}
      </div>

      {/* 文字区域 */}
      <div className="text-center w-full relative -mt-1">
        {editMode ? (
            <input 
              className="font-title text-lg text-gray-800 bg-gray-100 border border-gray-300 rounded px-1 w-full text-center mb-1 focus:ring-2 focus:ring-indigo-300 outline-none" 
              value={item.en} 
              onChange={(e) => onUpdateItem(categoryIdx, itemIdx, { ...item, en: e.target.value })} 
            />
        ) : (
            <div className="font-title text-lg text-gray-800 leading-tight truncate">{isQuizMode ? '???' : item.en}</div>
        )}

        {!isQuizMode && (
            editMode ? (
                <input 
                  className="font-pinyin text-xs text-gray-400 bg-gray-100 border border-gray-300 rounded px-1 w-full text-center my-1 focus:ring-2 focus:ring-indigo-300 outline-none" 
                  value={item.pinyin || ''} 
                  onChange={(e) => onUpdateItem(categoryIdx, itemIdx, { ...item, pinyin: e.target.value })} 
                />
            ) : (
                item.pinyin && <div className="font-pinyin text-[10px] text-gray-400 -mb-0.5">{item.pinyin}</div>
            )
        )}
        
        {editMode ? (
            <input 
              className="font-hand text-base text-gray-500 font-bold bg-gray-100 border border-gray-300 rounded px-1 w-full text-center mt-1 focus:ring-2 focus:ring-indigo-300 outline-none" 
              value={item.cn} 
              onChange={(e) => onUpdateItem(categoryIdx, itemIdx, { ...item, cn: e.target.value })} 
            />
        ) : (
            <div className="font-hand text-base text-gray-500 font-bold truncate">{isQuizMode ? '???' : item.cn}</div>
        )}
      </div>

      {/* 句子弹窗 */}
      {showSentence && sentence && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-2 text-center rounded-lg animate-fade-in border-2 border-pink-200 shadow-lg">
           <p className="font-hand text-sm text-gray-800 mb-1 leading-snug">{sentence.en}</p>
           <p className="font-hand text-xs text-gray-500">{sentence.cn}</p>
           <button onClick={(e) => {e.stopPropagation(); setShowSentence(false)}} className="absolute top-1 right-1 text-gray-400 p-1 hover:bg-gray-100 rounded-full"><X size={14} /></button>
        </div>
      )}
    </div>
  );
};

// --- 主程序 ---
export default function App() {
  const [topic, setTopic] = useState('');
  const [activeTab, setActiveTab] = useState('home'); 
  const [showInputPanel, setShowInputPanel] = useState(false);
  
  const [data, setData] = useState(INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  
  const [editMode, setEditMode] = useState(false);
  const [batchDrawing, setBatchDrawing] = useState(false);
  const [batchImages, setBatchImages] = useState({});
  const [currentStory, setCurrentStory] = useState(null);
  
  const [quizTarget, setQuizTarget] = useState(null);
  const [quizScore, setQuizScore] = useState(0);

  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || "";
  const proxyUrl = import.meta.env.VITE_PROXY_URL || "";
  
  const colorPalette = [
    { bg: "bg-red-50", border: "border-red-200" },
    { bg: "bg-orange-50", border: "border-orange-200" },
    { bg: "bg-yellow-50", border: "border-yellow-200" },
    { bg: "bg-green-50", border: "border-green-200" },
    { bg: "bg-blue-50", border: "border-blue-200" },
  ];


  // API Helper
  const safeFetch = async (url, options) => {
    if (!proxyUrl && !apiKey) throw new Error("Missing API key");
    const response = proxyUrl
      ? await fetch(proxyUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, options }) })
      : await fetch(`${url}?key=${apiKey}`, options);
    const text = await response.text();
    if (!response.ok) throw new Error(text || `API Error: ${response.status}`);
    try { return JSON.parse(text); } catch { return { raw: text }; }
  };

  const generateContent = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setShowInputPanel(false); 
    setBatchImages({});
    
    try {
      const systemPrompt = `Create vocabulary list for children. Topic: "${topic}". Return JSON: {"topicEn":"", "topicCn":"", "categories":[{"name":"", "cnName":"", "items":[{"en":"", "cn":"", "pinyin":"", "emoji":""}]}]}. Rules: 2-3 categories, 4 items each.`;
      const res = await safeFetch('https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `Topic: ${topic}` }] }], system_instruction: { parts: [{ text: systemPrompt }] }, generation_config: { response_mime_type: "application/json" } })
      });
      const parsedData = JSON.parse(res.candidates[0].content.parts[0].text);
      parsedData.categories = parsedData.categories.map((cat, i) => ({ ...cat, ...colorPalette[i % colorPalette.length] }));
      setData(parsedData);
    } catch (e) { alert(e.message?.includes('leaked') ? 'API Key 已泄露或被禁用，请更换新的密钥' : (e.message === 'Missing API key' ? '缺少 API Key，请在环境变量中配置后再试' : '生成失败，请重试')); } finally { setLoading(false); }
  };

  const generateImage = async (prompt) => {
    try {
      const res = await safeFetch('https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instances: [{ prompt }], parameters: { sampleCount: 1 } })
      });
      return `data:image/png;base64,${res.predictions[0].bytesBase64Encoded}`;
    } catch (e) { return null; }
  };

  const generateSpeech = async (text) => {
    try {
      const res = await safeFetch('https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text }] }], generation_config: { response_modalities: ["AUDIO"], speech_config: { voice_config: { prebuilt_voice_config: { voice_name: "Kore" } } } } })
      });
      const audioData = res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (audioData) playAudio(audioData);
    } catch (e) {}
  };

  const generateSentence = async (word, cnWord) => {
    try {
      const res = await safeFetch('https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `Simple sentence for child: ${word}` }] }], generation_config: { response_mime_type: "application/json", response_schema: {type: "OBJECT", properties: {en: {type: "STRING"}, cn: {type: "STRING"}}} } })
      });
      return JSON.parse(res.candidates[0].content.parts[0].text);
    } catch(e) { return {en:"Error", cn:"出错"}; }
  };

  const generateStory = async () => {
    const words = data.categories.flatMap(c => c.items.map(i=>i.en)).join(",");
    try {
      const res = await safeFetch('https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `Short story using: ${words}` }] }], generation_config: { response_mime_type: "application/json", response_schema: {type: "OBJECT", properties: {en: {type: "STRING"}, cn: {type: "STRING"}}} } })
      });
      setCurrentStory(JSON.parse(res.candidates[0].content.parts[0].text));
    } catch(e) {}
  };

  const playAudio = (base64) => {
    try {
        const binaryString = window.atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i=0; i<binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        const int16Array = new Int16Array(bytes.buffer);
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const buffer = ctx.createBuffer(1, int16Array.length, 24000);
        const chan = buffer.getChannelData(0);
        for (let i=0; i<int16Array.length; i++) chan[i] = int16Array[i]/32768.0;
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.connect(ctx.destination);
        src.start(0);
    } catch(e) { console.error(e); }
  };

  const handleAutoDraw = async () => {
    if (batchDrawing) return;
    setBatchDrawing(true);
    const queue = [];
    data.categories.forEach((c, cI) => c.items.forEach((item, iI) => {
        if (!batchImages[`${cI}-${iI}`]) queue.push({ cI, iI, prompt: `icon design of a ${item.en}, thick bold black marker outlines, flat vector art style, cute, sticker` });
    }));
    for (let i=0; i<queue.length; i++) {
        const url = await generateImage(queue[i].prompt);
        if (url) setBatchImages(prev => ({ ...prev, [`${queue[i].cI}-${queue[i].iI}`]: url }));
        if (i < queue.length - 1) await new Promise(r => setTimeout(r, 1500));
    }
    setBatchDrawing(false);
  };

  const handleExport = () => {
      const el = document.querySelector('.export-area');
      if (!el) return;
      html2canvas(el, { scale: 2, useCORS: true }).then(canvas => {
          const link = document.createElement('a');
          link.download = `WordCard-${data.topicEn}.png`;
          link.href = canvas.toDataURL();
          link.click();
      });
  };

  // Quiz Logic
  const startQuiz = () => {
      const all = data.categories.flatMap(c => c.items);
      const t = all[Math.floor(Math.random() * all.length)];
      setQuizTarget(t);
      setQuizScore(0);
      setTimeout(() => generateSpeech("Find " + t.en), 500);
  };
  const handleQuizClick = (item) => {
      if (item.en === quizTarget.en) {
          setQuizScore(s => s + 10);
          const all = data.categories.flatMap(c => c.items);
          const t = all[Math.floor(Math.random() * all.length)];
          setQuizTarget(t);
          generateSpeech("Good! Now find " + t.en);
      } else {
          generateSpeech("Try again");
      }
  };

  const onUpdateItem = (cIdx, iIdx, newItem) => {
    const newData = {...data};
    newData.categories[cIdx].items[iIdx] = newItem;
    setData(newData);
  };

  const isQuiz = activeTab === 'quiz';
  const isColoring = activeTab === 'color';

  useEffect(() => {
      if (isQuiz) startQuiz();
      else setQuizTarget(null);
  }, [isQuiz]);

  return (
    <div className={`min-h-screen pb-24 ${isColoring ? 'coloring-mode' : ''} ${isQuiz ? 'quiz-active' : ''}`}>
      <FontStyles />

      {/* 顶部 App Bar */}
      <div className="sticky top-0 bg-white/95 backdrop-blur shadow-sm z-40 px-4 py-3 flex items-center justify-between no-print safe-area-top">
        <div className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white p-1.5 rounded-lg transform -rotate-6 shadow-sm">
                <span className="font-title text-lg">Pro</span>
            </div>
            <h1 className="font-title text-xl text-indigo-900 tracking-wide">{data.topicEn}</h1>
        </div>
        <div className="flex items-center gap-2">
            {isQuiz && <div className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full font-bold text-sm animate-pulse">Score: {quizScore}</div>}
            <button onClick={() => setShowInputPanel(!showInputPanel)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 active:scale-95 transition-transform">
                {showInputPanel ? <X size={20} /> : <Edit3 size={20} />}
            </button>
        </div>
      </div>

      {/* 顶部输入面板 */}
      {showInputPanel && (
          <div className="bg-white p-4 border-b shadow-md animate-slide-down no-print fixed top-[60px] left-0 right-0 z-40">
              <input 
                value={topic} 
                onChange={e => setTopic(e.target.value)} 
                placeholder="输入新主题 (如: 动物, 交通...)"
                className="w-full border-2 border-indigo-100 rounded-xl px-4 py-3 text-lg font-hand mb-3 focus:border-indigo-500 outline-none"
              />
              <div className="flex gap-2">
                  <button onClick={generateContent} disabled={loading} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-md flex justify-center items-center gap-2 active:scale-95 transition-transform">
                      {loading ? <RefreshCw className="animate-spin" /> : <Sparkles />}
                      生成卡片
                  </button>
                  <button onClick={() => setEditMode(!editMode)} className={`px-4 rounded-xl font-bold border-2 active:scale-95 transition-transform ${editMode ? 'bg-green-100 border-green-500 text-green-700' : 'bg-white border-gray-200'}`}>
                      {editMode ? '完成' : '编辑'}
                  </button>
              </div>
          </div>
      )}

      {/* 菜单 Tab 页内容 */}
      {activeTab === 'menu' && (
          <div className="fixed inset-0 bg-white z-30 pt-24 px-6 pb-24 animate-fade-in no-print overflow-y-auto">
              <h2 className="font-title text-2xl mb-6 text-gray-800">更多功能</h2>
              <div className="grid grid-cols-2 gap-4">
                  <button onClick={handleAutoDraw} disabled={batchDrawing} className="p-4 bg-purple-50 rounded-2xl border-2 border-purple-100 flex flex-col items-center gap-2 active:scale-95 transition-transform">
                      {batchDrawing ? <RefreshCw className="animate-spin text-purple-600" /> : <Layers className="text-purple-600" />}
                      <span className="font-bold text-purple-700">自动绘图</span>
                  </button>
                  <button onClick={generateStory} className="p-4 bg-pink-50 rounded-2xl border-2 border-pink-100 flex flex-col items-center gap-2 active:scale-95 transition-transform">
                      <Wand2 className="text-pink-600" />
                      <span className="font-bold text-pink-700">生成故事</span>
                  </button>
                  <button onClick={handleExport} className="p-4 bg-blue-50 rounded-2xl border-2 border-blue-100 flex flex-col items-center gap-2 active:scale-95 transition-transform">
                      <Download className="text-blue-600" />
                      <span className="font-bold text-blue-700">保存图片</span>
                  </button>
                  <button onClick={() => window.print()} className="p-4 bg-gray-50 rounded-2xl border-2 border-gray-200 flex flex-col items-center gap-2 active:scale-95 transition-transform">
                      <Printer className="text-gray-600" />
                      <span className="font-bold text-gray-700">打印PDF</span>
                  </button>
              </div>
          </div>
      )}

      {/* 主要内容区域 */}
      <div className={`p-4 md:p-6 max-w-3xl mx-auto export-area ${isColoring ? 'bg-white' : ''} transition-colors duration-300`}>
          <div className={`doodle-border p-4 md:p-8 min-h-[60vh] ${isColoring ? 'bg-white' : 'bg-[#fffcf5]'} transition-colors duration-300`}>
             <div className="text-center mb-8">
                <h2 className="font-title text-4xl text-pink-500 text-stroke mb-1">{data.topicEn}</h2>
                <p className="font-title text-2xl text-indigo-400 text-stroke">{data.topicCn}</p>
             </div>

             {data.categories.map((cat, cIdx) => (
                 <div key={cIdx} className={`mb-6 p-4 rounded-2xl border-2 border-dashed ${cat.borderColor} relative`}>
                     <div className={`absolute inset-0 rounded-2xl ${cat.color} opacity-30 category-bg`}></div>
                     <h3 className="relative font-title text-xl text-gray-700 mb-4 flex items-center gap-2">
                         <span>📌</span> {cat.name} <span className="text-sm text-gray-400 font-hand">({cat.cnName})</span>
                     </h3>
                     <div className="relative grid grid-cols-2 gap-3 md:grid-cols-4">
                         {cat.items.map((item, iIdx) => (
                             <Card 
                               key={iIdx} 
                               item={item} 
                               categoryIdx={cIdx}
                               itemIdx={iIdx}
                               isQuizMode={isQuiz} 
                               coloringMode={isColoring}
                               editMode={editMode}
                               onUpdateItem={onUpdateItem}
                               onGenerateImage={generateImage}
                               onGenerateSpeech={generateSpeech}
                               onGenerateSentence={generateSentence}
                               onCardClick={handleQuizClick}
                               customImageOverride={batchImages[`${cIdx}-${iIdx}`]}
                             />
                         ))}
                     </div>
                 </div>
             ))}
             
             <div className="text-center text-gray-300 font-hand text-sm mt-8 pb-8">AI WordCard App</div>
          </div>
      </div>

      {/* 底部导航 */}
      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onGenerateClick={() => setShowInputPanel(true)} 
      />

      {/* 故事弹窗 */}
      {currentStory && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 no-print animate-fade-in" onClick={() => setCurrentStory(null)}>
              <div className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                  <h3 className="font-title text-2xl text-center mb-4 text-indigo-600">Story Time</h3>
                  <p className="font-hand text-xl mb-4 leading-relaxed">{currentStory.en}</p>
                  <div className="h-px bg-gray-200 my-4"></div>
                  <p className="font-hand text-lg text-gray-600">{currentStory.cn}</p>
                  <button onClick={() => setCurrentStory(null)} className="mt-6 w-full py-3 bg-gray-100 rounded-xl font-bold active:bg-gray-200">Close</button>
              </div>
          </div>
      )}
    </div>
  );
}
