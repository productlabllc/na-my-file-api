import { PrismaClient } from "@prisma/client";
import languagesJson from "./data/languages.json"
const prisma = new PrismaClient()


async function seedLanguages() {
    const languageCount = await prisma.language.count()
    if (languageCount > 0) {
        console.warn("languages already seeded: ", languageCount)
        return
    }

    const languages = await prisma.language.createMany({
        data: languagesJson.map(ele => ({...{
            Name: ele.name,
            Code: ele.code,
            
        },
    })),
    })

    return languages

}

async function seedWorkflows() {
    const workflowCount = await prisma.workflow.count()
    if (workflowCount > 0) {
        console.warn("workflows already seeded: ", workflowCount)
        return
    }

    const workflows = await prisma.workflow.createMany({
        data: [{
            Name: "HNDP",
            Description: "My File HDP Workflow",
        }],
    })

    return workflows


}

async function main() {
    await seedLanguages()

    await seedWorkflows()
    const usersCount = await prisma.user.count()

    if (usersCount > 0) {
        console.warn("users already seeded: ", usersCount)
        return
    }

    const userCount = prisma.user.createMany({
        data: [{
            LegacyId: "e4790d3d69ac4d0a9162908bc33602f0",
            IdpId: "e4790d3d69ac4d0a9162908bc33602f0",
            FirstName: "Wes",
            LastName: "Reid",
            Email: "myfile-001@yopmail.com",
        }],

    })

    return userCount
}

main().then(async () => {
    const newCount = await prisma.user.count()
    console.warn("seeding completed: ", newCount)
    await prisma.$disconnect()
})
.catch(async (error) => {
    console.error(error);
    await prisma.$disconnect()
})