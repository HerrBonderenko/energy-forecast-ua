// Lucide-style icon set. Usage:
//   <Icon name="Zap" size={20} />
//   import { Zap } from '@/components/ui/Icons'; <Zap size={20} />

const IconBase = ({ size = 20, stroke = 2, className = '', children, label, ...rest }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden={label ? undefined : true}
    aria-label={label}
    role={label ? 'img' : undefined}
    {...rest}
  >
    {children}
  </svg>
);

// ----- Brand -----
export const Zap = (p) => (
  <IconBase {...p}>
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
  </IconBase>
);

// ----- Navigation -----
export const LayoutDashboard = (p) => (
  <IconBase {...p}>
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </IconBase>
);
export const TrendingUp = (p) => (
  <IconBase {...p}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </IconBase>
);
export const TrendingDown = (p) => (
  <IconBase {...p}>
    <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
    <polyline points="16 17 22 17 22 11" />
  </IconBase>
);
export const Sliders = (p) => (
  <IconBase {...p}>
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </IconBase>
);
export const Bookmark = (p) => (
  <IconBase {...p}>
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
  </IconBase>
);
export const BarChart3 = (p) => (
  <IconBase {...p}>
    <path d="M3 3v18h18" />
    <path d="M7 16V8" />
    <path d="M12 16v-5" />
    <path d="M17 16V5" />
  </IconBase>
);
export const Network = (p) => (
  <IconBase {...p}>
    <rect x="9" y="2" width="6" height="6" rx="1" />
    <rect x="3" y="16" width="6" height="6" rx="1" />
    <rect x="15" y="16" width="6" height="6" rx="1" />
    <path d="M12 8v4" />
    <path d="M6 16v-2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
  </IconBase>
);
export const History = (p) => (
  <IconBase {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l3 2" />
  </IconBase>
);
export const Settings = (p) => (
  <IconBase {...p}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </IconBase>
);

// ----- Theme -----
export const Sun = (p) => (
  <IconBase {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </IconBase>
);
export const Moon = (p) => (
  <IconBase {...p}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </IconBase>
);

// ----- Actions -----
export const RefreshCw = (p) => (
  <IconBase {...p}>
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    <path d="M3 21v-5h5" />
  </IconBase>
);
export const Download = (p) => (
  <IconBase {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </IconBase>
);
export const Upload = (p) => (
  <IconBase {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </IconBase>
);
export const Save = (p) => (
  <IconBase {...p}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </IconBase>
);
export const Plus = (p) => (
  <IconBase {...p}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </IconBase>
);
export const Copy = (p) => (
  <IconBase {...p}>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </IconBase>
);
export const Trash2 = (p) => (
  <IconBase {...p}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </IconBase>
);
export const Edit = (p) => (
  <IconBase {...p}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </IconBase>
);
export const Search = (p) => (
  <IconBase {...p}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </IconBase>
);
export const Filter = (p) => (
  <IconBase {...p}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </IconBase>
);

// ----- Status / feedback -----
export const CheckCircle = (p) => (
  <IconBase {...p}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </IconBase>
);
export const Check = (p) => (
  <IconBase {...p}>
    <polyline points="20 6 9 17 4 12" />
  </IconBase>
);
export const AlertTriangle = (p) => (
  <IconBase {...p}>
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </IconBase>
);
export const AlertCircle = (p) => (
  <IconBase {...p}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </IconBase>
);
export const Info = (p) => (
  <IconBase {...p}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </IconBase>
);

// ----- UI controls -----
export const X = (p) => (
  <IconBase {...p}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="18" x2="18" y2="6" />
  </IconBase>
);
export const Menu = (p) => (
  <IconBase {...p}>
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="18" x2="20" y2="18" />
  </IconBase>
);
export const ChevronDown = (p) => (
  <IconBase {...p}>
    <polyline points="6 9 12 15 18 9" />
  </IconBase>
);
export const ChevronUp = (p) => (
  <IconBase {...p}>
    <polyline points="18 15 12 9 6 15" />
  </IconBase>
);
export const ChevronRight = (p) => (
  <IconBase {...p}>
    <polyline points="9 18 15 12 9 6" />
  </IconBase>
);
export const ChevronLeft = (p) => (
  <IconBase {...p}>
    <polyline points="15 18 9 12 15 6" />
  </IconBase>
);
export const ArrowRight = (p) => (
  <IconBase {...p}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </IconBase>
);
export const ArrowLeft = (p) => (
  <IconBase {...p}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </IconBase>
);
export const MoreHorizontal = (p) => (
  <IconBase {...p}>
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </IconBase>
);
export const ExternalLink = (p) => (
  <IconBase {...p}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </IconBase>
);

// ----- Domain / data -----
export const Cloud = (p) => (
  <IconBase {...p}>
    <path d="M17.5 19a4.5 4.5 0 1 0-1.4-8.78A7 7 0 1 0 4 16.5" />
    <path d="M4 16.5h13.5" />
  </IconBase>
);
export const Thermometer = (p) => (
  <IconBase {...p}>
    <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0z" />
  </IconBase>
);
export const Wind = (p) => (
  <IconBase {...p}>
    <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
    <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
    <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
  </IconBase>
);
export const Calendar = (p) => (
  <IconBase {...p}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </IconBase>
);
export const Clock = (p) => (
  <IconBase {...p}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </IconBase>
);
export const Brain = (p) => (
  <IconBase {...p}>
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2z" />
  </IconBase>
);
export const Database = (p) => (
  <IconBase {...p}>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </IconBase>
);
export const Users = (p) => (
  <IconBase {...p}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </IconBase>
);
export const FileText = (p) => (
  <IconBase {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </IconBase>
);
export const Inbox = (p) => (
  <IconBase {...p}>
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </IconBase>
);
export const Eye = (p) => (
  <IconBase {...p}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </IconBase>
);
export const GitBranch = (p) => (
  <IconBase {...p}>
    <line x1="6" y1="3" x2="6" y2="15" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M18 9a9 9 0 0 1-9 9" />
  </IconBase>
);
export const Scale = (p) => (
  <IconBase {...p}>
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="M7 21h10" />
    <path d="M12 3v18" />
    <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
  </IconBase>
);
export const FolderOpen = (p) => (
  <IconBase {...p}>
    <path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2" />
  </IconBase>
);
export const PlayCircle = (p) => (
  <IconBase {...p}>
    <circle cx="12" cy="12" r="10" />
    <polygon points="10 8 16 12 10 16 10 8" />
  </IconBase>
);
export const Play = (p) => (
  <IconBase {...p}>
    <polygon points="5 3 19 12 5 21 5 3" />
  </IconBase>
);
export const Mail = (p) => (
  <IconBase {...p}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </IconBase>
);
export const Github = (p) => (
  <IconBase {...p}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </IconBase>
);

// ----- Map name → component (для зворотної сумісності з артефактом 4) -----
const ICON_MAP = {
  Zap, zap: Zap,
  LayoutDashboard, 'layout-dashboard': LayoutDashboard,
  TrendingUp, 'trending-up': TrendingUp,
  TrendingDown, 'trending-down': TrendingDown,
  Sliders, sliders: Sliders,
  Bookmark, bookmark: Bookmark,
  BarChart3, 'bar-chart-3': BarChart3,
  Network, network: Network,
  History, history: History,
  Settings, settings: Settings,
  Sun, sun: Sun,
  Moon, moon: Moon,
  RefreshCw, 'refresh-cw': RefreshCw,
  Download, download: Download,
  Upload, upload: Upload,
  Save, save: Save,
  Plus, plus: Plus,
  Copy, copy: Copy,
  Trash2, 'trash-2': Trash2, trash: Trash2,
  Edit, edit: Edit,
  Search, search: Search,
  Filter, filter: Filter,
  CheckCircle, 'check-circle': CheckCircle,
  Check, check: Check,
  AlertTriangle, 'alert-triangle': AlertTriangle,
  AlertCircle, 'alert-circle': AlertCircle,
  Info, info: Info,
  X, x: X,
  Menu, menu: Menu,
  ChevronDown, 'chevron-down': ChevronDown,
  ChevronUp, 'chevron-up': ChevronUp,
  ChevronRight, 'chevron-right': ChevronRight,
  ChevronLeft, 'chevron-left': ChevronLeft,
  ArrowRight, 'arrow-right': ArrowRight,
  ArrowLeft, 'arrow-left': ArrowLeft,
  MoreHorizontal, 'more-horizontal': MoreHorizontal,
  ExternalLink, 'external-link': ExternalLink,
  Cloud, cloud: Cloud,
  Thermometer, thermometer: Thermometer,
  Wind, wind: Wind,
  Calendar, calendar: Calendar,
  Clock, clock: Clock,
  Brain, brain: Brain,
  Database, database: Database,
  Users, users: Users,
  FileText, 'file-text': FileText,
  Inbox, inbox: Inbox,
  Eye, eye: Eye,
  GitBranch, 'git-branch': GitBranch,
  Scale, scale: Scale,
  FolderOpen, 'folder-open': FolderOpen,
  PlayCircle, 'play-circle': PlayCircle,
  Play, play: Play,
  Mail, mail: Mail,
  Github, github: Github,
  RotateCcw: RefreshCw, 'rotate-ccw': RefreshCw,
};

// Generic <Icon name="..."> wrapper
export function Icon({ name, ...rest }) {
  const Cmp = ICON_MAP[name];
  if (!Cmp) {
    if (typeof console !== 'undefined') console.warn(`Icon "${name}" not found`);
    return null;
  }
  return <Cmp {...rest} />;
}
