---
title: "How To: Create Curriculum"
description: "Build a curriculum using Fairview standards."
navTitle: "Create Curriculum"
navSection: "Ongoing Competency 20xx"
navIcon: "layers"
navOrder: 60
---

# How To: Create Curriculum

Use the curriculum template and these checks:

Curriculum Template
When you have created your Introduction material and the validation options, you can copy and modify the Curriculum template.

1. Navigate to the *Menu > Content Management > Catalog* page and select the *Curriculum* link
2. Search for **Ongoing Competency 2026: [Site] [Unit/Specialty] - [Title] - [Role]**
3. select the three dots on the right and then select the *Copy Curriculum* button
<img class="guide-image" src="https://mnfhs.sharepoint.com/sites/LearningManagementSystem/Shared%20Documents/cornerstone-help-docs/ongoing-competency-2026/create-curriculum-1.png" alt="curriculum1">
4. General Page:
    1. Enter the *Title* according to this syntax: **Ongoing Competency 2026: [Site] [Unit/Specialty] - [Title] - [Role]**
    2. Add a *Subject* by clicking the *Add Subject* button, searching for the audience's specialty, and clicking the specialty title
5. select the *Next* button until you reach the *Structure* page
6. Structure page:
    1. Replace the template introduction material with the introduction material for this competency
        1. select the trash can icon on the right side of the object, and then select the *Yes* button to confirm
        2. select the *Add Training* button on the *Introduction* section
        3. Search for your introduction material, select the *Add* link, scroll down and select the *Add* button
        4. Check the four boxes on the training object
<img class="guide-image" src="https://mnfhs.sharepoint.com/sites/LearningManagementSystem/Shared%20Documents/cornerstone-help-docs/ongoing-competency-2026/create-curriculum-4.png" alt="curriculum4">
        5. Ensure the training is indented inside the *Introduction* section and is set to "1" for sequence
<img class="guide-image" src="https://mnfhs.sharepoint.com/sites/LearningManagementSystem/Shared%20Documents/cornerstone-help-docs/ongoing-competency-2026/create-curriculum-3.png" alt="curriculum3">
    2. Replace the template test in the *Validation Options* section with your validation options
        1. select the trash can icon on the right side of the object, and then select the *Yes* button to confirm
        2. select the *Add Training* button on the *Introduction* section
            - If you are adding a checklist, select the three dots and select the *Add Checklist* button
<img class="guide-image" src="https://mnfhs.sharepoint.com/sites/LearningManagementSystem/Shared%20Documents/cornerstone-help-docs/ongoing-competency-2026/create-curriculum-2.png" alt="curriculum2">
        3. Search for training object(s), select the *Add* link, scroll down and select the *Add* button
        4. Check the four boxes on the training object(s)
<img class="guide-image" src="https://mnfhs.sharepoint.com/sites/LearningManagementSystem/Shared%20Documents/cornerstone-help-docs/ongoing-competency-2026/create-curriculum-4.png" alt="curriculum4">
        5. Ensure all of the validation options are indented inside the *Validation Options* section and are set to "1" for order
<img class="guide-image" src="https://mnfhs.sharepoint.com/sites/LearningManagementSystem/Shared%20Documents/cornerstone-help-docs/ongoing-competency-2026/create-curriculum-5.png" alt="curriculum5">
            - The *Validation Options* section itself should be set to "2" for order so that users must complete the introduction material before proceeding to validation
            - If you have a complex build, see the note below
        6. select the *three dots* button on the right side of the *Validation Options* section and select the *Edit* button
<img class="guide-image" src="https://mnfhs.sharepoint.com/sites/LearningManagementSystem/Shared%20Documents/cornerstone-help-docs/ongoing-competency-2026/create-curriculum-6.png" alt="curriculum6">
        7. Set the *Required* field to "1" and select the *Save* button
<img class="guide-image" src="https://mnfhs.sharepoint.com/sites/LearningManagementSystem/Shared%20Documents/cornerstone-help-docs/ongoing-competency-2026/create-curriculum-7.png" alt="curriculum7">
7. select the *Save* button to finish creating your Curriculum
8. Follow the steps in the How To Create Evaluation article to attach a post-evaluation: [https://fvlms.github.io/2026-ongoing-competency/how-to-create-evaluation/#attach-the-evaluation-to-a-training-object](https://fvlms.github.io/2026-ongoing-competency/how-to-create-evaluation/#attach-the-evaluation-to-a-training-object)

---

## Complex Build

If you have a combination of items that need to be completed to validate a competency, you will likely need to add sections with multiple items inside the *Validation Options* section.

E.g. users are required to complete [a lesson and a test] OR [a checklist]. To configure this you need to set your structure like the below example. If you put all three items in the overall structure and then set it to *1 of 3* required, just taking the eLearning would complete the curriculum. Or if you set it to *2 of 3* required, they would have to complete the checklist AND one additional item. The configuration below allows the checklist OR a combination of the other two items to complete the curriculum.

    Validation Options [structure] (1 of 2 required)
        [checklist]
        Test [structure] (2 of 2 required)
            [eLearning]
            [test]
