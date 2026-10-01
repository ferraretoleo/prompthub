import { Copy, Eye, GitFork, Heart, Lock, Globe2 } from "lucide-react";

export type PromptItem = {
  id:string; title:string; slug:string; description:string; visibility:"PRIVATE"|"PUBLIC"; currentVersion:number;
  updatedAt:string; userId:string; favoritesCount:number; forksCount:number; viewsCount:number;
  authorName:string; authorUsername:string; avatarUrl?:string|null;
};

export default function PromptCard({ item }: { item: PromptItem }) {
  return <article className="card">
    <div className="cardhead">
      <div className="avatar">{item.authorName?.slice(0,1).toUpperCase() || "P"}</div>
      <div style={{minWidth:0,flex:1}}>
        <div><strong>{item.authorName}</strong> <span className="meta">@{item.authorUsername} · v{item.currentVersion}</span></div>
        <h2>{item.title}</h2>
        <p>{item.description}</p>
        <div className="tags"><span className="tag">Prompt</span><span className="tag">v{item.currentVersion}</span><span className="tag">{item.visibility === "PUBLIC" ? "Público" : "Privado"}</span></div>
        <div className="actions">
          <span className="action"><Eye size={16}/>{item.viewsCount}</span>
          <span className="action"><Heart size={16}/>{item.favoritesCount}</span>
          <span className="action"><GitFork size={16}/>{item.forksCount}</span>
          <span className="action"><Copy size={16}/>Copiar</span>
          <span className="action">{item.visibility === "PUBLIC" ? <Globe2 size={16}/> : <Lock size={16}/>}</span>
        </div>
      </div>
    </div>
  </article>;
}
