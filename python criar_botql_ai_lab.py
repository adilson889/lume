#!/usr/bin/env python3
"""
Cria a estrutura inicial do BotQL-AI-Lab.

Uso:
    python criar_botql_ai_lab.py
    python criar_botql_ai_lab.py /caminho/para/o/repositorio
    python criar_botql_ai_lab.py --nome AION-Lab

Por padrão, cria a pasta BotQL-AI-Lab no directório actual.
Não apaga nem substitui ficheiros existentes.
"""

from pathlib import Path
import argparse

DIRECTORIES = [
    "bot",
    "database",
    "knowledge/technology",
    "knowledge/science",
    "knowledge/mathematics",
    "knowledge/education",
    "knowledge/programming",
    "knowledge/history",
    "knowledge/general",
    "knowledge/everyday",
    "rag",
    "tests",
]

FILES = {
    "README.md": """# BotQL AI Lab

Laboratório de testes reais para a linguagem BotQL.

Este projecto contém um bot conversacional baseado em regras, base de
conhecimento, recuperação de informação (RAG), contexto e persistência.

## Estrutura

- `bot/`: lógica e comportamento do bot em BotQL.
- `database/`: esquemas e dados SQL.
- `knowledge/`: conhecimento organizado por domínio.
- `rag/`: perguntas, variações, sinónimos e casos de avaliação.
- `tests/`: testes funcionais, de recuperação e de carga.

## Objectivo

Avaliar o BotQL com um projecto suficientemente completo para testar o
parser, interpretador, imports, base de dados, RAG, contexto e execução
concorrente.

> Este laboratório não é, por si só, um modelo de linguagem treinado.
> É um sistema conversacional baseado em conhecimento, recuperação e regras.
""",
    "bot/main.botql": "// Ponto de entrada do bot. Adicionar aqui a sintaxe BotQL validada.\n",
    "bot/personality.botql": "// Personalidade, tom e regras gerais do assistente.\n",
    "bot/conversation.botql": "// Fluxos e regras de conversação.\n",
    "bot/reasoning.botql": "// Regras de análise, selecção e composição de respostas.\n",
    "bot/fallback.botql": "// Respostas para perguntas desconhecidas ou ambíguas.\n",
    "database/users.sql": "-- Estrutura e dados de utilizadores.\n",
    "database/knowledge.sql": "-- Estrutura e dados da base de conhecimento.\n",
    "database/conversations.sql": "-- Estrutura e dados das conversas.\n",
    "database/intents.sql": "-- Intenções e respectivas expressões.\n",
    "database/categories.sql": "-- Categorias de conhecimento.\n",
    "database/learning.sql": "-- Registos de feedback e melhoria controlada.\n",
    "rag/questions.txt": "# Perguntas de referência para avaliação do RAG.\n",
    "rag/synonyms.txt": "# Sinónimos e termos equivalentes.\n",
    "rag/variations.txt": "# Variações linguísticas das perguntas.\n",
    "rag/test_cases.txt": "# Casos de teste: pergunta, resposta esperada e contexto.\n",
    "tests/retrieval.sql": "-- Testes de recuperação de conhecimento.\n",
    "tests/context.sql": "-- Testes de manutenção e recuperação de contexto.\n",
    "tests/conversations.sql": "-- Testes de fluxos conversacionais.\n",
    "tests/stress_tests.sql": "-- Testes de volume e concorrência.\n",
    ".gitignore": "__pycache__/\n*.py[cod]\n.env\n.DS_Store\n",
}


def create_project(destination: Path, project_name: str) -> None:
    root = destination / project_name
    root.mkdir(parents=True, exist_ok=True)

    created_dirs = 0
    existing_dirs = 0
    created_files = 0
    existing_files = 0

    for relative in DIRECTORIES:
        path = root / relative
        if path.exists():
            existing_dirs += 1
        else:
            path.mkdir(parents=True, exist_ok=True)
            created_dirs += 1

    for relative, content in FILES.items():
        path = root / relative
        path.parent.mkdir(parents=True, exist_ok=True)

        if path.exists():
            existing_files += 1
            continue

        path.write_text(content, encoding="utf-8")
        created_files += 1

    print(f"\nProjecto preparado em: {root.resolve()}")
    print(f"Pastas criadas: {created_dirs}")
    print(f"Pastas já existentes: {existing_dirs}")
    print(f"Ficheiros criados: {created_files}")
    print(f"Ficheiros preservados (já existiam): {existing_files}")
    print("\nNenhum ficheiro existente foi substituído.")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Cria a estrutura inicial do BotQL AI Lab."
    )
    parser.add_argument(
        "destination",
        nargs="?",
        default=".",
        help="Directório onde será criada a pasta do projecto (por padrão: actual).",
    )
    parser.add_argument(
        "--nome",
        default="BotQL-AI-Lab",
        help="Nome da pasta do projecto (por padrão: BotQL-AI-Lab).",
    )
    args = parser.parse_args()

    destination = Path(args.destination).expanduser()
    if not destination.exists():
        parser.error(f"O directório de destino não existe: {destination}")
    if not destination.is_dir():
        parser.error(f"O destino não é um directório: {destination}")

    create_project(destination, args.nome)


if __name__ == "__main__":
    main()
