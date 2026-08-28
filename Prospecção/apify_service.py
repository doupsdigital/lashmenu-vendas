import os
from dotenv import load_dotenv
from apify_client import ApifyClient

# Carrega variáveis do .env na raiz do projeto
load_dotenv()

def get_apify_client():
    token = os.getenv("APIFY_API_TOKEN")
    if not token:
        raise ValueError("APIFY_API_TOKEN não foi encontrado no arquivo .env!")
    return ApifyClient(token)

def check_account():
    client = get_apify_client()
    user = client.user().get()
    return user

def create_lash_prospecting_task(
    city: str = "Goiânia",
    max_places: int = 40,
    min_rating: float = 4.0,
    min_reviews: int = 3
):
    """
    Cria a Saved Task na Apify para prospecção de Lash Designers via Google Maps Extractor.
    """
    client = get_apify_client()
    
    search_terms = [
        f"Lash Designer em {city}",
        f"Extensão de Cílios em {city}",
        f"Studio de Cílios em {city}",
        f"Design de Cílios e Sobrancelhas em {city}"
    ]
    
    task_input = {
        "searchStringsArray": search_terms,
        "locationQuery": f"{city}, Goiás, Brasil",
        "maxCrawledPlacesPerSearch": max_places // len(search_terms),
        "maxCrawledPlaces": max_places,
        "minRating": min_rating,
        "minReviewsCount": min_reviews,
        "scrapeWebsiteSocialMedia": True,
        "scrapeServices": True,
        "language": "pt-BR"
    }
    
    task_name = f"Prospeccao-LashDesigner-{city.replace(' ', '')}-LashMenu"
    
    # Verifica se já existe uma task com esse nome para atualizar ou criar nova
    tasks = client.tasks().list().items
    existing_task = next((t for t in tasks if t['name'] == task_name), None)
    
    if existing_task:
        task = client.task(existing_task['id']).update(task_input=task_input)
        print(f" Task atualizada com sucesso! ID: {task['id']}")
    else:
        task = client.tasks().create(
            actor_id="compass/google-maps-extractor",
            name=task_name,
            task_input=task_input
        )
        print(f" Nova Saved Task criada com sucesso! ID: {task['id']}")
        
    return task

if __name__ == "__main__":
    try:
        user_info = check_account()
        print(" Conexão com Apify confirmada!")
        print(f"Usuário: {user_info.get('username')} ({user_info.get('email')})")
    except Exception as e:
        print(f" Erro ao conectar com a Apify: {e}")
