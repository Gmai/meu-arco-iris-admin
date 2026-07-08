# Validador de Pedidos com IA

Um sistema web robusto e moderno construído para o time de logística, focado na auditoria visual de pedidos. Utilizando a Inteligência Artificial do Google Gemini, o sistema analisa e extrai informações diretamente de fotos de Notas Fiscais e imagens dos produtos físicos para apontar automaticamente qualquer divergência entre o que foi faturado e o que realmente está sendo despachado.

## 🚀 Funcionalidades Principais

*   **Autenticação Segura:** Sistema protegido de ponta a ponta com NextAuth.js (usuários limitados ao banco de dados).
*   **Armazenamento Seguro na Nuvem:** Integração nativa com o **Google Cloud Storage**. Todas as imagens são salvas em buckets 100% privados (acessíveis no sistema apenas por *Signed URLs* temporárias).
*   **Inteligência Artificial Multimodal:** Integração direta com a API do **Google Gemini (1.5 Flash)** para "ler" as fotos e analisar quantidades de itens cruzando com os papéis físicos.
*   **Dashboard Rápido:** Tabela de listagem limpa, ágil, com filtros diretos por cliente e número de pedido e com destaques visuais nas anomalias e erros (Status Válido ou Divergente).
*   **Design Customizado e Puro:** Layout moderno, responsivo e limpo, sem dependências de estilização complexas de front-end, mantendo altíssima velocidade.

## 🛠️ Stack Tecnológica

*   **Framework:** Next.js (App Router, Server Components)
*   **Linguagem:** TypeScript
*   **Banco de Dados:** PostgreSQL (Google Cloud SQL)
*   **ORM:** Prisma ORM
*   **Autenticação:** NextAuth.js (com Credentials e JWT criptografado em Bcrypt)
*   **Armazenamento:** Google Cloud Storage (`@google-cloud/storage`)
*   **Inteligência Artificial:** Google Generative AI (`@google/generative-ai`)

---

## ⚙️ Configuração Local e Execução

### 1. Pré-requisitos
*   Node.js instalado (v18+)
*   NPM ou Yarn
*   Um banco de dados PostgreSQL rodando (Local ou Cloud)

### 2. Instalação
Faça o clone do repositório e rode o comando abaixo na pasta raiz para instalar as dependências:
```bash
npm install
```

### 3. Configuração do `.env`
Na raiz do seu projeto, crie um arquivo chamado `.env` com todas as chaves abaixo. (Lembre-se: o arquivo `.env` já é ignorado pelo Git automaticamente por motivos de segurança).

```env
# Banco de Dados
# Insira a URL de conexão do PostgreSQL
DATABASE_URL="postgresql://usuario:senha@ip_do_banco:5432/nome_do_banco"

# Autenticação (NextAuth)
# O SECRET é uma chave aleatória usada para criptografar o cookie da sessão
NEXTAUTH_SECRET="uma_chave_super_secreta_qualquer_aqui_123"
# A URL onde a aplicação está rodando
NEXTAUTH_URL="http://localhost:3000"

# Inteligência Artificial (Gemini)
# Chave obtida no Google AI Studio (https://aistudio.google.com/)
GEMINI_API_KEY="AIzaSySuaChaveAqui..."

# Google Cloud Storage (Fotos Protegidas)
# Nome exato do seu Bucket no GCS
GCS_BUCKET_NAME="nome-do-seu-bucket-aqui"
# Caminho para o seu arquivo de chave da conta de serviço (Service Account)
# Ex: Baixe o arquivo no painel do Google, coloque na raiz do projeto e nomeie como "google-key.json"
GOOGLE_APPLICATION_CREDENTIALS="./google-key.json"
```

> **Nota:** O arquivo de credenciais do Google Cloud Storage (`google-key.json` ou qualquer `*.json.key`) também foi adicionado ao seu `.gitignore` e não será enviado para a nuvem.

### 4. Configurando o Banco (Prisma)
Gere o cliente do banco de dados e sincronize as tabelas:
```bash
npx prisma generate
npx prisma db push
```

Para criar um usuário administrador para acessar a plataforma, rode a semente (seed) do banco:
```bash
npx tsx prisma/seed.ts
```
Isso criará o usuário: `admin@validador.com` com a senha: `admin123`.

### 5. Executando o Projeto
Inicie o servidor de desenvolvimento:
```bash
npm run dev
```
Agora, acesse [http://localhost:3000](http://localhost:3000) no seu navegador, faça o login com a conta recém-criada e pronto!

---

## 📸 Arquitetura de Imagens Privadas
1. O usuário anexa arquivos e submete. O Next.js recebe o `FormData`.
2. O servidor envia os Buffers para a API do Gemini e, em paralelo, salva-os no seu Bucket trancado no **Google Cloud Storage**.
3. Apenas a URL base Google Storage é gravada no seu banco de dados PostgreSQL.
4. Quando o usuário clica para ver as "Detalhes" de um pedido, o Next.js solicita de maneira dinâmica ao GCP uma **Signed URL (URL Assinada)**.
5. As imagens carregam com chaves restritas que expiram em 15 minutos, impedindo vazamentos definitivos de dados logísticos.
