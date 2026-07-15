"use client";

import { useCallback, useMemo } from 'react';
import ReactFlow, { 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  MarkerType,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { User, Phone, Mail, Building, CreditCard, Laptop, ShieldAlert, Globe, MapPin } from 'lucide-react';

const ICONS: Record<string, any> = {
  Person: User,
  "Phone Number": Phone,
  Email: Mail,
  "Bank Account": Building,
  "Credit Card": CreditCard,
  "Device ID": Laptop,
  Website: Globe,
  Location: MapPin,
};

const CustomNode = ({ data }: any) => {
  const Icon = ICONS[data.type] || ShieldAlert;
  
  // Color based on risk score
  const isHighRisk = data.risk_score > 0.7;
  const isMediumRisk = data.risk_score > 0.4 && data.risk_score <= 0.7;
  
  const bgClass = isHighRisk 
    ? "bg-red-500/20 border-red-500 text-red-500" 
    : isMediumRisk 
      ? "bg-amber-500/20 border-amber-500 text-amber-500"
      : "bg-emerald-500/20 border-emerald-500 text-emerald-500";

  return (
    <div className={`px-4 py-2 shadow-xl rounded-lg border-2 bg-slate-900 backdrop-blur-md flex items-center gap-3 w-48 ${bgClass}`}>
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-slate-500" />
      <div className={`p-2 rounded-md ${bgClass.replace('/20', '/30').replace('border-', 'bg-transparent border-0')}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="text-xs font-bold truncate text-slate-200">{data.label}</div>
        <div className="text-[10px] uppercase tracking-wider opacity-70 truncate">{data.type}</div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-slate-500" />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

interface NetworkGraphProps {
  initialNodes: any[];
  initialEdges: any[];
  onNodeClick: (event: any, node: any) => void;
}

export default function NetworkGraph({ initialNodes, initialEdges, onNodeClick }: NetworkGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialEdges.map(e => ({
      ...e,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 15,
        height: 15,
        color: '#6366f1',
      },
      style: {
        strokeWidth: 2,
        stroke: '#6366f1',
        opacity: 0.8
      }
    }))
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      nodeTypes={nodeTypes}
      fitView
      className="bg-slate-950"
      defaultEdgeOptions={{
        type: 'smoothstep',
      }}
    >
      <Controls className="bg-slate-800 fill-white border-slate-700" />
      <MiniMap 
        nodeColor={(node: any) => {
          if (node.data?.risk_score > 0.7) return '#ef4444';
          if (node.data?.risk_score > 0.4) return '#f59e0b';
          return '#10b981';
        }}
        maskColor="rgba(2, 6, 23, 0.7)"
        className="bg-slate-900 border-slate-800"
      />
      <Background color="#1e293b" gap={16} size={1} />
    </ReactFlow>
  );
}
