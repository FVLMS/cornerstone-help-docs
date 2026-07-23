---
title: "Group Management"
description: "Create, edit, and manage custom groups in Cornerstone."
navTitle: "Group Management"
navSection: "What's New?"
navIcon: "users"
navOrder: 20
---

# Group Management

Use this guide to create or edit a custom group and manage its membership in Cornerstone.

## Pilot Availability

Group Management is currently available as a pilot before it is released more broadly. Email LMS@fairview.org if you are interested in being part of the pilot group.

## Before You Begin

- Confirm the purpose of the group and who should be included.
- Prepare a clear title and description.
- Choose a unique Group ID using the format `DEPT-PURPOSE-AUDIENCE`. Use uppercase letters with hyphens and no spaces, such as `EDU-BLS-INSTRUCTORS`.
- Contact the LMS team before using dynamic criteria if you are unsure how the criteria will affect membership.

## Access Group Management

1. Go to **Menu > System Administrator > Groups Management**.
2. Review the groups created by users in your department.
3. Select **Create Group** to create a group, or search for an existing group and select **Edit**.

<!-- Image 1: Groups Management page with the Create Group and Edit controls. -->

## Create or Edit a Group

1. Enter the required group details:

   - **Title:** Use a clear, human-readable name.
   - **Description:** Explain the group's purpose and intended membership.
   - **Group ID:** Follow the `DEPT-PURPOSE-AUDIENCE` convention.

2. Review the information for accuracy.
3. Continue to the membership section.

<!-- Image 2: Group details fields for Title, Description, and Group ID. -->

## Manage Members

1. In the membership section, select **Add Members** for a new group or **Edit Members** for a group that already has members.
2. Choose how to add members:

   - **Add individual users:** Select **Add Section**, choose **User** in the **Select Attribute** field, search for the user under **Select Value**, check the correct name, and select **Apply**.
   - **Upload members:** Select **Upload Members** and upload an `.xlsx` or `.csv` file containing one column of User IDs with no header.
   - **Use dynamic criteria:** On the **Dynamic Members** tab, select **Add Section** and choose criteria such as division or position. Criteria in the same section use **AND** logic. A new section uses **OR** logic.

3. To remove a manually added member, open the **Manually Added Members** tab and clear the checkbox next to the user's name.
4. Select **Save**.
5. Wait until **Cancel Preview** changes to **Search Preview**.
6. Select **Save as Draft** or **Publish**.
7. Allow time for the membership to update, then return to the group and confirm that the correct users are included.

## Notes

- Review the membership carefully before publishing a group.
- Group membership may not update immediately.
- Contact the LMS team at LMS@fairview.org if the group includes a large population or if the membership criteria are unclear.

<!-- References:
https://vrc-support.zendesk.com/hc/en-us/articles/45271233130509-NEW-Redesigned-Custom-Groups-Creating-Groups
https://vrc-support.zendesk.com/hc/en-us/articles/45128400536973-NEW-Redesigned-Custom-Groups-Managing-Groups
-->
