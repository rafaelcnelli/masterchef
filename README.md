# MasterChef Cronômetro Oficial ⏱️🔥

Cronômetro regressivo oficial para provas de culinária no estilo MasterChef, com tema preto e laranja, alertas sonoros de 15 em 15 minutos e nos últimos 10, 5 e 1 minuto, e modo telão (tela cheia somente com o relógio).

## 🚀 Como publicar no GitHub Pages (Resolvendo o erro 404 do main.tsx)

O erro `404 main.tsx` acontece porque o GitHub Pages padrão tenta carregar os arquivos sem compilar. O navegador não consegue rodar arquivos `.tsx` diretamente sem que o build (`dist`) seja gerado.

Você tem **2 formas super fáceis** de publicar:

---

### Opção 1: Comando Automático (Mais Rápido e Recomendado)

Basta rodar no seu terminal local:
```bash
npm run deploy
```
Este comando vai:
1. Executar `npm run build` e gerar o pacote compilado na pasta `dist`
2. Enviar a pasta `dist` diretamente para o branch `gh-pages` no seu repositório
3. No GitHub (**Settings > Pages**), selecione a branch **gh-pages** e salve! Seu app abrirá funcionando 100%.

---

### Opção 2: Via GitHub Actions (Sem comandos extras)

Se você já deu `git push` de todo o código no GitHub:
1. Acesse o seu repositório no GitHub.
2. Vá em **Settings** > **Pages** (no menu lateral esquerdo).
3. Em **Build and deployment** > **Source**, mude de *"Deploy from a branch"* para:
   👉 **GitHub Actions**
4. Pronto! O arquivo `.github/workflows/deploy.yml` já incluído no projeto compilará o Vite e publicará os arquivos corretos automaticamente.

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
