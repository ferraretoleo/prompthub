import "dotenv/config";
import { createDb, categories } from "./index.js";

type CategorySeed = {
  name: string;
  slug: string;
};

const rows: CategorySeed[] = [
  { name: "Desenvolvimento", slug: "desenvolvimento" },
  { name: "Banco de Dados", slug: "banco-de-dados" },
  { name: "SQL Server", slug: "sql-server" },
  { name: "PostgreSQL", slug: "postgresql" },
  { name: "Progress OpenEdge", slug: "progress-openedge" },
  { name: "Oracle", slug: "oracle" },
  { name: "DevOps", slug: "devops" },
  { name: "Cloud", slug: "cloud" },
  { name: "IA", slug: "ia" },
  { name: "Marketing", slug: "marketing" },
  { name: "Redes Sociais", slug: "redes-sociais" },
  { name: "Análise de Dados", slug: "analise-de-dados" },
  { name: "Automação", slug: "automacao" },
  { name: "Escrita", slug: "escrita" },
  { name: "Educação", slug: "educacao" },
  { name: "Outros", slug: "outros" }
];

const db = createDb();

await db
  .insert(categories)
  .values(rows)
  .onConflictDoNothing({ target: categories.slug });

console.log("Categorias iniciais gravadas.");
