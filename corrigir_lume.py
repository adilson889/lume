#!/usr/bin/env python3
"""
Migra a estrutura já existente do LUME para respeitar as extensões BotQL:

    .sql = lógica do bot e operações da base de dados
    .txt = conhecimento e outros conteúdos textuais

O script:
- renomeia ficheiros .botql para .sql;
- renomeia README.md para README.txt;
- não apaga ficheiros;
- não substitui ficheiros de destino já existentes;
- pode ser executado mais de uma vez sem estragar o projecto.

Coloca este ficheiro na raiz do repositório e executa:
    python corrigir_lume.py

Também funciona se for colocado dentro da pasta LUME.
"""

from pathlib import Path
import argparse


def find_lume_root(location: Path) -> Path:
    # Caso o script esteja dentro da própria pasta LUME.
    if (location / "bot").is_dir() or (location / "knowledge").is_dir():
        return location

    # Caso o script esteja na raiz do repositório e LUME seja uma subpasta.
    candidate = location / "LUME"
    if candidate.is_dir():
        return candidate

    raise FileNotFoundError(
        "Não encontrei a pasta LUME. Coloca este script na raiz do repositório "
        "ou dentro da própria pasta LUME."
    )


def migrate_extension(root: Path, old_suffix: str, new_suffix: str):
    renamed = []
    skipped = []

    for source in sorted(root.rglob(f"*{old_suffix}")):
        if not source.is_file():
            continue

        target = source.with_suffix(new_suffix)

        if target.exists():
            skipped.append((source, target))
            continue

        source.rename(target)
        renamed.append((source, target))

    return renamed, skipped


def migrate_readme(root: Path):
    source = root / "README.md"
    target = root / "README.txt"

    if not source.exists():
        return "README.md não encontrado; nada a fazer."

    if target.exists():
        return "README.txt já existe; README.md foi preservado para evitar perda de conteúdo."

    source.rename(target)
    return "README.md renomeado para README.txt."


def main():
    parser = argparse.ArgumentParser(
        description="Corrige as extensões dos ficheiros do projecto LUME."
    )
    parser.add_argument(
        "--diretorio",
        default=".",
        help="Raiz do repositório ou pasta LUME. Por padrão: directório actual.",
    )
    args = parser.parse_args()

    location = Path(args.diretorio).expanduser().resolve()

    try:
        root = find_lume_root(location)
    except FileNotFoundError as error:
        parser.error(str(error))

    print(f"\nA corrigir o projecto: {root}\n")

    renamed, skipped = migrate_extension(root, ".botql", ".sql")

    print(f"Ficheiros .botql convertidos para .sql: {len(renamed)}")
    for old, new in renamed:
        print(f"  {old.relative_to(root)} -> {new.relative_to(root)}")

    if skipped:
        print("\nFicheiros não renomeados porque o destino já existe:")
        for old, new in skipped:
            print(f"  {old.relative_to(root)} -> {new.relative_to(root)}")

    print("\n" + migrate_readme(root))

    remaining = [
        path.relative_to(root)
        for path in root.rglob("*")
        if path.is_file() and path.suffix.lower() not in {".sql", ".txt"}
    ]

    print("\nVerificação das extensões:")
    if remaining:
        print("Foram encontrados ficheiros com outras extensões:")
        for path in remaining:
            print(f"  {path}")
        print(
            "\nNão foram apagados nem alterados automaticamente. "
            "Verifica-os antes de decidir o que fazer."
        )
    else:
        print("Todos os ficheiros do LUME usam .sql ou .txt.")

    print("\nMigração concluída. Nenhum ficheiro foi apagado ou substituído.")


if __name__ == "__main__":
    main()
