# Contributing to WordDrop

First off, thank you for considering contributing to WordDrop! It's people like you that make open source such a great community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Pull Requests](#pull-requests)
- [Development Setup](#development-setup)
- [Style Guidelines](#style-guidelines)
  - [Git Commit Messages](#git-commit-messages)
  - [JavaScript & CSS Style](#javascript--css-style)

---

## Code of Conduct

This project and everyone participating in it is governed by the [WordDrop Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior.

---

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible using our **Bug Report Template**.

**Explain the problem and include additional details to help maintainers reproduce the problem:**

- **Use a clear and descriptive title** for the issue.
- **Describe the exact steps** which reproduce the problem.
- **Provide specific examples** to demonstrate the steps.
- **Describe the behavior** you observed after following the steps.
- **Explain which behavior you expected** to see instead and why.
- **Include screenshots or GIFs** if possible.

### Suggesting Features

Feature suggestions are tracked as GitHub issues. When creating a feature suggestion, please use our **Feature Request Template**.

- **Use a clear and descriptive title** for the issue.
- **Provide a step-by-step description** of the suggested feature.
- **Provide specific examples** to demonstrate the steps.
- **Describe the current behavior** and **explain which behavior you expected** to see instead.
- **Explain why this feature would be useful** to most WordDrop users.

### Pull Requests

- Fill in the required template
- Do not include issue numbers in the PR title
- Include screenshots and animated GIFs in your pull request whenever possible
- End all files with a newline
- Avoid platform-dependent code (e.g., path separators)
- Follow the [Style Guidelines](#style-guidelines)

---

## Development Setup

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   git clone https://github.com/YOUR-USERNAME/worddrop.git
   cd worddrop
3. **Create a branch** for your changes:
   git checkout -b feature/your-feature-name
4. **Make your changes** and test them locally.
5. **Commit your changes** following the commit message guidelines.
6. **Push to your fork**:
   git push origin feature/your-feature-name
7. **Open a Pull Request** against the `main` branch of the original repository.

---

## Style Guidelines

### Git Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. This leads to more readable messages that are easy to follow when looking through the project history.

**Format:** `<type>(<scope>): <subject>`

**Allowed Types:**

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc.)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

**Examples:**
- `feat(duel): add spectator mode`
- `fix(auth): resolve google oauth redirect loop`
- `docs(readme): update installation instructions`
- `style(css): format landing page styles`

### JavaScript & CSS Style

- Use **2 spaces** for indentation (enforced by `.editorconfig`).
- Use **single quotes** for strings in JavaScript.
- Use **semicolons** at the end of statements.
- Prefer `const` over `let` (only use `let` when reassignment is necessary).
- Keep CSS selectors specific but not overly nested.

---

## Questions?

If you have any questions, feel free to reach out:

- **Telegram:** [@worddrop_uz](https://t.me/worddrop_uz)
- **Email:** bexruzyoldoshev@yahoo.com

Thank you for contributing! 💙
