# MasterChef Cronômetro Oficial ⏱️🔥

Cronômetro regressivo oficial para provas de culinária no estilo MasterChef, com tema preto e laranja, alertas sonoros de 15 em 15 minutos e nos últimos 10, 5 e 1 minuto, e modo telão (tela cheia somente com o relógio).

## 🚀 Como publicar no GitHub Pages

Este projeto já está 100% configurado para o GitHub Pages com o fluxo automatizado do GitHub Actions.

### Passo a Passo:

1. **Crie um repositório no GitHub**:
   - Acesse [github.com/new](https://github.com/new)
   - Dê um nome ao seu repositório (ex: `cronometro-masterchef`) e clique em **Create repository**.

2. **Envie os arquivos para o repositório**:
   No seu terminal, dentro da pasta do projeto:
   ```bash
   git init
   git add .
   git commit -m "feat: MasterChef Cronometro Oficial"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
   git push -u origin main
   ```

3. **Ative o GitHub Pages**:
   - No GitHub, entre no seu repositório e clique na aba **Settings** (Configurações).
   - No menu lateral esquerdo, clique em **Pages**.
   - Em **Build and deployment** > **Source**, selecione:
     👉 **GitHub Actions**
   - Pronto! O workflow `.github/workflows/deploy.yml` irá compilar e publicar o site automaticamente em segundos no endereço:
     `https://SEU_USUARIO.github.io/SEU_REPOSITORIO/`

---

## 🛠️ Executar Localmente

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento local
npm run dev

# Gerar build de produção
npm run build
```

## ✨ Funcionalidades

- **Visual MasterChef**: Fundo preto escuro, mostrador circular estilizado com a logo oficial MasterChef e dígitos em laranja brilhante.
- **Modo Telão (Somente Relógio)**: Tela cheia exclusiva do relógio sem menus ou painéis, ideal para projetores ou monitor de bancada.
- **Alertas Sonoros Automáticos**:
  - A cada 15 minutos (gongo duplo de estúdio).
  - Últimos 10 minutos (tensão crescente).
  - Últimos 5 minutos (pulsos de empratamento).
  - Último 1 minuto (sirene de reta final).
  - Últimos 10 segundos (ticks segundo a segundo).
  - Tempo Esgotado / Mãos para cima (buzina de encerramento).
- **Atalhos de Teclado**:
  - `Espaço`: Play / Pausar
  - `R`: Recomeçar
  - `Z`: Zerar
  - `F` ou `Esc`: Alternar / Sair da tela cheia
