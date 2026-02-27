import {
    Brain,
    Code,
    Database,
    MessageSquare,
    Play,
    Settings,
    Zap
} from 'lucide-react';
import { motion } from 'motion/react';

const GraphPreview = () => {
  return (
    <div className="w-full bg-zinc-900 text-white font-sans rounded-xl overflow-hidden shadow-2xl">
      {/* Window Header */}
      <div className="h-10 bg-zinc-800 flex items-center justify-between px-4 border-b border-zinc-700">
        <div className="flex items-center gap-6">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
          </div>
          <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-400 uppercase tracking-widest">
            <Code size={12} />
            <span>rivet-project / main.rivet</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-700 rounded text-[10px] font-bold text-zinc-300">
            <Play size={10} fill="currentColor" />
            RUN
          </div>
          <Settings size={14} className="text-zinc-500" />
        </div>
      </div>

      <div className="flex h-[400px]">
        {/* Sidebar */}
        <div className="w-12 border-r border-zinc-800 flex flex-col items-center py-4 gap-6 text-zinc-500">
          <Database size={20} className="text-primary" />
          <MessageSquare size={20} />
          <Zap size={20} />
          <Brain size={20} />
          <div className="mt-auto">
            <Settings size={20} />
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 relative overflow-hidden bg-zinc-950">
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-20" 
               style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          
          {/* Nodes */}
          <div className="absolute inset-0 p-8">
            {/* Node 1: Input */}
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="absolute left-6 top-12 w-40 bg-zinc-900 border border-zinc-700 rounded-lg p-2 shadow-xl"
            >
              <div className="flex items-center gap-2 mb-2 border-b border-zinc-800 pb-2">
                <div className="w-4 h-4 bg-blue-500 rounded flex items-center justify-center">
                  <MessageSquare size={10} className="text-white" />
                </div>
                <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-300">User Input</span>
              </div>
              <div className="space-y-1.5">
                <div className="h-1 w-full bg-zinc-800 rounded" />
                <div className="h-1 w-2/3 bg-zinc-800 rounded" />
              </div>
              <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-zinc-900 border border-zinc-700 rounded-full" />
            </motion.div>

            {/* Node 2: AI Logic */}
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 bg-zinc-900 border border-primary/50 rounded-lg p-2 shadow-2xl shadow-primary/5"
            >
              <div className="flex items-center gap-2 mb-2 border-b border-zinc-800 pb-2">
                <div className="w-4 h-4 bg-primary rounded flex items-center justify-center">
                  <Brain size={10} className="text-white" />
                </div>
                <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-300">LLM Chain</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[6px] text-zinc-500 uppercase">Model</span>
                  <span className="text-[6px] text-primary font-bold">GPT-4o</span>
                </div>
                <div className="h-1 w-full bg-zinc-800 rounded" />
                <div className="h-1 w-full bg-zinc-800 rounded" />
              </div>
              <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-zinc-900 border border-zinc-700 rounded-full" />
              <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-zinc-900 border border-primary rounded-full" />
            </motion.div>

            {/* Node 3: Output */}
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="absolute right-6 bottom-12 w-40 bg-zinc-900 border border-zinc-700 rounded-lg p-2 shadow-xl"
            >
              <div className="flex items-center gap-2 mb-2 border-b border-zinc-800 pb-2">
                <div className="w-4 h-4 bg-emerald-500 rounded flex items-center justify-center">
                  <Zap size={10} className="text-white" />
                </div>
                <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-300">Response</span>
              </div>
              <div className="space-y-1.5">
                <div className="h-1 w-full bg-emerald-500/20 rounded" />
                <div className="h-1 w-full bg-emerald-500/20 rounded" />
              </div>
              <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-zinc-900 border border-zinc-700 rounded-full" />
            </motion.div>

            {/* Connection Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <motion.path
                d="M 180 140 C 250 140, 250 200, 320 200"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="2"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, delay: 0.6 }}
              />
              <motion.path
                d="M 480 200 C 550 200, 550 300, 620 300"
                stroke="#FF3300"
                strokeWidth="2"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, delay: 1.2 }}
              />
            </svg>
          </div>

          {/* Floating Tooltip */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2 }}
            className="absolute top-1/2 left-[60%] bg-zinc-800 border border-zinc-700 p-2 rounded shadow-2xl text-[6px] font-mono text-emerald-400"
          >
            {`{ "status": "success", "tokens": 42 }`}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default GraphPreview;
