
import React from 'react';
import { Project, ProjectStatus } from '../types.ts';
import { TrendingUp, Users, Target, Activity } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onClick: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  return (
    <div 
      onClick={() => onClick(project)}
      className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden active:scale-[0.98] transition-all cursor-pointer group shadow-xl"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <img 
          src={project.image} 
          alt={project.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="px-2 py-1 bg-emerald-500/90 text-slate-950 text-[10px] font-bold uppercase rounded tracking-wider shadow-sm flex items-center gap-1">
            <Activity size={10} /> {project.status}
          </span>
          {project.isTrending && (
            <span className="px-2 py-1 bg-amber-500/90 text-slate-950 text-[10px] font-bold uppercase rounded flex items-center gap-1 shadow-sm">
              <TrendingUp size={10} /> Trending
            </span>
          )}
        </div>
        <div className="absolute bottom-3 right-3 px-2 py-1 bg-slate-950/80 backdrop-blur-md border border-white/10 rounded text-xs font-medium text-white shadow-sm">
          {project.category}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-lg font-bold text-slate-100 leading-tight group-hover:text-emerald-400 transition-colors">
            {project.title}
          </h3>
          <p className="text-sm text-slate-400 mt-1 line-clamp-2">
            {project.pitch}
          </p>
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Live Pool Value</span>
            <span className="text-emerald-400 font-black">${project.amountRaised.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-500 uppercase font-bold tracking-tight">
            <Users size={12} className="text-slate-400" /> {project.investorsCount}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
