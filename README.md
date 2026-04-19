<!-- ===== HEADER COM LOGO (ajuste o caminho se necessário) ===== -->
<p align="center">
  <img src="https://dacc.unir.br/uploads/91919191/diversos/Logo%20DACC%202017.png" alt="Logo DACC UNIR"/>
</p>

<h1 align="center">
Mural Mobile
</h1>

<p align="center">
Projeto vinculado ao Departamento Acadêmico de Ciência da Computação — UNIR
</p>

---

## 🏛️ Sobre

Este repositório contém um projeto desenvolvido no âmbito do **Departamento Acadêmico de Ciência da Computação (DACC)** da **Universidade Federal de Rondônia (UNIR)**.

O projeto pode estar associado a atividades de:

- ensino
- pesquisa
- extensão
- desenvolvimento tecnológico

---

## 🎯 Objetivo

Descreva aqui o objetivo principal do projeto.

---

## 📂 Estrutura do repositório

```
src/           → código-fonte
flake.nix      → ambiente de desenvolvimento reproduzível
README.md      → visão geral do projeto
CONTRIBUTING.md → diretrizes de contribuição
```

---

## 🚀 Como executar

Este projeto utiliza **Nix Flakes** para fornecer um ambiente de desenvolvimento reproduzível contendo:

- Node.js
- Java (JDK 17)
- Android SDK
- ferramentas necessárias para **React Native + Expo**

Isso reduz configuração manual no sistema.

### 1. Pré-requisitos

Instale o **Nix** com suporte a flakes.

Exemplo:

```bash
sh <(curl -L https://nixos.org/nix/install)
mkdir -p ~/.config/nix
echo "experimental-features = nix-command flakes" >> ~/.config/nix/nix.conf
```

Verifique:

```bash
nix --version
```

### 2. Entrar no ambiente de desenvolvimento

No diretório do projeto:

```bash
nix develop
```

Isso disponibiliza o ambiente com dependências como Android SDK, Java e Node.js.

### 3. Iniciar o emulador Android

Se o flake estiver configurado para criar o AVD automaticamente, basta iniciar:

```bash
emulator -avd expo-avd
```

Verifique se o dispositivo está ativo:

```bash
adb devices
```

### 4. Instalar dependências do projeto

Use o gerenciador definido pelo projeto:

```bash
npm install
```

### 5. Executar o projeto Expo

Inicie o servidor de desenvolvimento:

```bash
npx expo start
```

Para abrir no emulador Android, pressione `a`, ou rode:

```bash
npx expo run:android
```

### 6. Fluxo típico de desenvolvimento

```bash
nix develop
npm run android
```

---

## 🤝 Contribuição

As diretrizes de contribuição estão no arquivo [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## ⚖️ Licença

Este projeto está licenciado conforme o arquivo `LICENSE`.

---

## 📍 Contexto institucional

Departamento Acadêmico de Ciência da Computação  
Fundação Universidade Federal de Rondônia — UNIR  
Campus Porto Velho — RO — Brasil
