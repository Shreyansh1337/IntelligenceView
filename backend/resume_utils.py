CATEGORY_KEYWORDS = {
    "education": [
        "b.tech", "btech", "b.e", "b.e.", "bca", "b.sc", "bsc",
        "m.tech", "mtech", "mca", "m.sc", "msc",
        "bachelor", "master", "phd", "degree",
        "university", "college", "school",
        "computer science", "information technology"
    ],

    "skills": [
        "python", "java", "c++", "c#", "javascript", "typescript",
        "html", "css", "react", "angular", "node.js",
        "fastapi", "flask", "django",
        "sql", "postgresql", "mysql", "mongodb",
        "git", "github", "docker",
        "aws", "azure", "machine learning",
        "deep learning", "data science", "tensorflow",
        "pytorch", "api", "rest api"
    ],

    "projects": [
        "project", "projects", "built", "developed",
        "created", "designed", "implemented",
        "application", "web application", "website",
        "system", "platform", "developed a", "built a"
    ],

    "experience": [
        "experience", "work experience", "internship",
        "intern", "worked at", "working at",
        "developer", "software engineer", "engineer",
        "employee", "professional experience",
        "employment", "company"
    ],

    "other": [
        "certification", "certifications",
        "certificate", "achievement", "achievements",
        "award", "awards", "hackathon",
        "competition", "publication",
        "volunteer", "leadership",
        "extracurricular"
    ]
}


CATEGORY_WEIGHTS = {
    "education": 20,
    "skills": 25,
    "projects": 25,
    "experience": 20,
    "other": 10
}


def check_resume_suitability(text: str):

    text = text.lower()

    score = 0
    categories_found = []

    for category, keywords in CATEGORY_KEYWORDS.items():

        found = False

        for keyword in keywords:
            if keyword in text:
                found = True
                break

        if found:
            score += CATEGORY_WEIGHTS[category]
            categories_found.append(category)

    return {
        "score": score,
        "categories_found": categories_found
    }