import { PrismaClient } from "@prisma/client";
import languagesJson from "./data/languages.json"
import { CRITERION_FULFILLMENT_TYPE, ROLE_NAMES, USER_ROLES } from '../src/lib/constants/index';
const prisma = new PrismaClient()

async function createStakeholderGroups() {
    await prisma.$transaction(async (prisma) => {
        const stakeholderGroupCount = await prisma.stakeholderGroup.count()
        if (stakeholderGroupCount > 0) {
            console.warn("stakeholder groups already seeded: ", stakeholderGroupCount)
            return
        }



        await prisma.stakeholderGroup.createMany({
            data: [{
                Name: ROLE_NAMES.FAMILY,
                Description: "The client or family of the client are the main stakeholders of the myfile platform, they are the ones who will be using the platform to access their files and communicate with their case managers",
            }, {
                Name: ROLE_NAMES.TRUSTED_USER,
                Description: "A family member or trusted user is someone who is trusted by the client to access their files and communicate with their case manager on their behalf",
            }, {
                Name: ROLE_NAMES.HPD_ADMIN,
                Description: "HPD Admin Agents are the responsible of HPD programs on  the platform",

            }, {
                Name: ROLE_NAMES.DHS_ADMIN,
                Description: "DHS Admin Agents are the responsible of PATH programs on  the platform",
            }, {
                Name: ROLE_NAMES.DHS_MEMBER,
                Description: "PATH Team Members take part PATH programs on  the platform",
            }, {
                Name: ROLE_NAMES.HRA_ADMIN,
                Description: "HRA Admin Agents are the responsible of HRA programs on  the platform",
            }, {
                Name: ROLE_NAMES.SPONSOR,
                Description: "A sponsor is someone who is sponsoring the platform",
            }, {
                Name: ROLE_NAMES.CBO_AGENT,
                Description: "Community Base Organization Staffer wanting to take part in a FLOW",
            }],
        })

        const rolesMap = {
            [ROLE_NAMES.FAMILY]: USER_ROLES.CLIENT,
            [ROLE_NAMES.TRUSTED_USER]: USER_ROLES.TRUSTED_USER,
            [ROLE_NAMES.HPD_ADMIN]: USER_ROLES.HPD_ADMIN,
            [ROLE_NAMES.DHS_ADMIN]: USER_ROLES.DHS_ADMIN,
            [ROLE_NAMES.DHS_MEMBER]: USER_ROLES.DHS_MEMBER,
            [ROLE_NAMES.HRA_ADMIN]: USER_ROLES.HRA_ADMIN,
            [ROLE_NAMES.SPONSOR]: USER_ROLES.SPONSOR,
            [ROLE_NAMES.CBO_AGENT]: USER_ROLES.CBO_MEMBER,
        }


        const stakeHolderGroup = await prisma.stakeholderGroup.findMany()

        const stakeholderGroupRoles: { Name: USER_ROLES|null; Description: string | null; StakeholderGroupId?: string }[] = stakeHolderGroup.map((ele) => {
            if (!rolesMap[ele?.Name! as keyof typeof rolesMap]) throw new Error(`Role not found for ${ele.Name}`)

            return {
                Name: rolesMap[ele.Name! as keyof typeof rolesMap],
                Description: ele.Description,
                StakeholderGroupId: ele.id,
            }
        })

        // These StakeholderGroupRoles are not linked to any StakeholderGroup

        stakeholderGroupRoles.push({
            Name: USER_ROLES.PLATFORM_ADMIN,
            Description: "Admin of the platform",
        }, {
            Name: USER_ROLES.DHS_MEMBER,
            Description: "HPD Editor",
        }, {
            Name: USER_ROLES.HPD_READ_ONLY,
            Description: "HPD Read Only",
        });


        await prisma.stakeholderGroupRole.createMany({
            data: stakeholderGroupRoles,
        })

    })

}

async function seedLanguages() {
    const languageCount = await prisma.language.count()
    if (languageCount > 0) {
        console.warn("languages already seeded: ", languageCount)
        return
    }

    const languages = await prisma.language.createMany({
        data: languagesJson.map(ele => ({
            ...{
                Name: ele.name,
                Code: ele.code,

            },
        })),
    })

    return languages

}

async function seedWorkflows() {
    await prisma.$transaction(async (prisma) => {
        // const workflowCount = await prisma.workflow.count()
        // if (workflowCount > 0) {
        //     console.warn("workflows already seeded: ", workflowCount)
        //     return
        // } 

        await prisma.workflow.createMany({
            data: [{
                Name: "HDP Workflow",
                Description: "My File HDP Workflow",
            }, {
                Name: "PATH Workflow",
                Description: "My File PATH Workflow",
            }],
        })

        const pathWorkflow = await prisma.workflow.findFirst({
            where: {
                Name: "PATH Workflow",
            },
        })

        await prisma.workflowStage.createMany({
            data: [{
                StageName: "Checklist 1",
                WorkflowId: pathWorkflow?.id,
            }, {
                StageName: "Past 2 years Proof of Residence",
                WorkflowId: pathWorkflow?.id,
            }],
        });

        const ckecklist1 = await prisma.workflowStage.findFirst({
            where: {
                StageName: "Checklist 1",
            },
        });

        const pastResidenceProof = await prisma.workflowStage.findFirst({
            where: {
                StageName: "Past 2 years Proof of Residence",
            },
        });  

        // add workflow stage criterion
        await prisma.workflowStageCriterion.createMany({
            data: [{
                CaseWorkflowStageId: ckecklist1?.id,
                Name: "Copies of birth certificates for all minors in your family",
                CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.ALL,
            }, {
                CaseWorkflowStageId: ckecklist1?.id,
                Name: "Copies of picture ID for all persons over 18 (examples: driver’s license, passport, Military ID, non-driver ID, Green Card)",
                CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.ALL,
            },
            {
                CaseWorkflowStageId: ckecklist1?.id,
                Name: "Copies of Social Security cards or Tax ID (ITIN) for all family members",
                CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.ALL,
            }, {
                CaseWorkflowStageId: ckecklist1?.id,
                Name: "If working, copies of most recent paystubs for employed family members",
                CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.ALL,
            }, {
                CaseWorkflowStageId: ckecklist1?.id,
                Name: "If applicable, proof of disability accommodation needs for family members",
                CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.ALL,
            }, {
                CaseWorkflowStageId: ckecklist1?.id,
                Name: "If applicable, proof of custody for family members",
                CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.ALL,
            }, {
                CaseWorkflowStageId: pastResidenceProof?.id,
                Name: "Copies of residency bills (cable, phone, utility bill or statement), must include your full name and address",
                CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.ALL,
            }, {
                CaseWorkflowStageId: pastResidenceProof?.id,
                Name: "Copies of residency lease agreements, must include your full name and address",
                CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.ALL,
            }, {
                CaseWorkflowStageId: pastResidenceProof?.id,
                Name: "Copies of residency letters from other family members or friends with dates of stay and address",
                CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.ALL,
            }, {
                CaseWorkflowStageId: pastResidenceProof?.id,
                Name: "If working, copies of most recent paystubs for employed adult family members",
                CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.ALL,
            }, {
                CaseWorkflowStageId: pastResidenceProof?.id,
                Name: "If working, copies of most recent paystubs for employed adult family members",
                CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.ALL,
            }, {
                CaseWorkflowStageId: pastResidenceProof?.id,
                Name: "Copies of residency eviction papers or marshall notices",
                CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.ALL,
            }, {
                CaseWorkflowStageId: pastResidenceProof?.id,
                Name: "Copies of school letters verifying enrollment for all family members attending school (examples: New York City public school, private school, college, university)",
                CriterionFulfillmentType: CRITERION_FULFILLMENT_TYPE.ALL,
            }],
        });
    })


}

async function seedUsers() {
    const usersCount = await prisma.user.count()


    const stakeholderGroup = await prisma.stakeholderGroupRole.findMany()

    const idpId = "e4790d3d69ac4d0a9162908bc33602f0"

    if (usersCount > 0) {
        console.warn("users already seeded: ", usersCount)
        
    } else {

    await prisma.user.createMany({
        data: [{
            LegacyId: "e4790d3d69ac4d0a9162908bc33602f0",
            IdpId: idpId,
            FirstName: "Wes",
            LastName: "Reid",
            Email: "myfile-001@yopmail.com",
        }],
    })
}
   
    const user = await prisma.user.findFirst({
        where: {
            IdpId: idpId,
        },
        select: {
            id: true
        }
    
    })

    const userStakeholderGroupRole = stakeholderGroup.map(ele => ({
        StakeholderGroupRoleId: ele.id,
        UserId: user?.id,
    }))

    // check if user already has stakeholder group role

    const userStakeholderGroupRoleCount = await prisma.user_StakeholderGroupRole.count({
        where: {
            UserId: user?.id,
        },
    })

    if (userStakeholderGroupRoleCount > 0) {
        console.warn("user already has stakeholder group role: ", userStakeholderGroupRoleCount)
        return
    }

    await prisma.user_StakeholderGroupRole.createMany({
        data: userStakeholderGroupRole,
    
    })
    
}

async function main() {
    await createStakeholderGroups()

    await seedLanguages()

    await seedWorkflows()

    await seedUsers()
   
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