interface Subject {
    id: number
    name: string
}

export async function getSubjects(): Promise<Subject[]> {
    const subjectArray: Subject[] = [
        { id: 1, name: "Matemaatika" },
        { id: 2, name: "Eesti Keel" },
        { id: 3, name: "Sibula keel" },
        { id: 4, name: "Keemia"},
        { id: 5, name: "Andmeblyaasid" },
        { id: 6, name: "Fortnite" },
        { id: 7, name: "Bitcoin" }

    ]

    return subjectArray
}