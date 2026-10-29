
from pathlib import Path
from ultralytics import YOLO

# Pasta onde este script está localizado
BASE_DIR = Path(__file__).resolve().parent

# Arquivos do dataset
DATA_YAML = BASE_DIR / "data.yaml"
PASTA_IMAGENS = BASE_DIR / "train" / "images"
PASTA_LABELS = BASE_DIR / "train" / "labels"

# Verifica se os arquivos e pastas existem
if not DATA_YAML.exists():
    raise FileNotFoundError(f"Arquivo não encontrado: {DATA_YAML}")

if not PASTA_IMAGENS.exists() or not PASTA_LABELS.exists():
    raise FileNotFoundError("Confira as pastas train/images e train/labels.")

imagens = [
    p for p in PASTA_IMAGENS.iterdir()
    if p.suffix.lower() in (".jpg", ".jpeg", ".png")
]

if not imagens:
    raise RuntimeError("Nenhuma imagem encontrada.")

# Confere se cada imagem possui uma anotação
sem_anotacao = [
    imagem.name
    for imagem in imagens
    if not (PASTA_LABELS / f"{imagem.stem}.txt").exists()
]

if sem_anotacao:
    raise RuntimeError(
        "Faltam anotações para: " + ", ".join(sem_anotacao)
    )

print(f"Imagens encontradas: {len(imagens)}")
print("Anotações correspondentes encontradas.")
print("Dataset conferido. Ainda não iniciou o treinamento.")

# O treinamento será habilitado depois de separar
# corretamente os conjuntos de treino e validação.
