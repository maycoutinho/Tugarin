# Identificação das miniaturas 3D no Tugarin

Esta integração mantém as telas existentes. A tela `/camera` continua abrindo a câmera do navegador e, quando o serviço Python está ativo, envia quadros reduzidos para o YOLO e desenha as caixas de detecção sobre o vídeo.

## 1. Instalar o serviço Python

Use Python 3.10 ou 3.11 recomendado. Na pasta `SistemaCadastro`, crie e ative um ambiente virtual e instale as dependências:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements-yolo.txt
```

## 2. Preparar o modelo

**O projeto ainda não inclui pesos YOLO treinados para as miniaturas.** Para criar `best.pt`, fotografe as tartarugas impressas em vários ângulos e iluminações, anote as caixas com Roboflow ou CVAT e exporte o dataset no formato YOLO. Separe imagens diferentes para treino e validação.

Crie `data.yaml` apontando para seu dataset, por exemplo:

```yaml
path: dataset
train: images/train
val: images/val
names:
  0: tartaruga_modelo_a
  1: tartaruga_modelo_b
```

Ajuste os nomes para o que as miniaturas realmente representam. Instale `ultralytics` e execute o treinamento (em `treinar.py`):

```python
from ultralytics import YOLO
model = YOLO("yolo11n.pt")
model.train(data="data.yaml", epochs=50, imgsz=640, batch=8, project="runs/detect", name="tartarugas")
```

O resultado esperado fica em `runs/detect/tartarugas/weights/best.pt`.

## 3. Iniciar o detector

Em um terminal na pasta `SistemaCadastro`:

```bash
uvicorn yolo_service:app --host 127.0.0.1 --port 8000
```

Teste `http://127.0.0.1:8000/health`. Para usar outro caminho para os pesos, defina a variável `TUGARIN_YOLO_MODEL`.

## 4. Iniciar o aplicativo

Em outro terminal, execute o Node/Express como de costume (`npm install` se necessário e `npm start`). Abra `/camera`, permita a câmera e aponte para as miniaturas. A câmera do navegador requer `localhost` ou HTTPS.

## Observações importantes

- Sem `best.pt`, a câmera continua funcionando, mas o serviço informa que o modelo ainda não foi treinado; nenhuma detecção falsa é exibida.
- Este protótipo é para reconhecer as miniaturas impressas. Não representa um detector validado para tartarugas reais na praia.
- O navegador envia quadros para `http://127.0.0.1:8000`; isso funciona em desenvolvimento local. Para acesso pelo celular, o serviço deve estar hospedado em um endereço acessível pelo aparelho e configurado com segurança/CORS adequado.
