# Xano Endpoints and Tables

This document lists all API endpoints and database tables found in `my-workspace`.

## API Endpoints

Total endpoint files: **40**

| Method | Route | Source File |
|---|---|---|
| GET | `/authentication/1_start_here_demo_page` | `my-workspace/api/authentication/1_start_here_demo_page_GET.xs` |
| POST | `/authentication/auth/login` | `my-workspace/api/authentication/auth/login_POST.xs` |
| POST | `/authentication/create_student` | `my-workspace/api/authentication/create_student_POST.xs` |
| POST | `/authentication/demo_agent/conversation` | `my-workspace/api/authentication/demo_agent/conversation_POST.xs` |
| GET | `/authentication/get_audit_report` | `my-workspace/api/authentication/get_audit_report_GET.xs` |
| POST | `/authentication/message/send_welcome_email` | `my-workspace/api/authentication/message/send_welcome_email_POST.xs` |
| POST | `/authentication/reset/magic_link_login` | `my-workspace/api/authentication/reset/magic_link_login_POST.xs` |
| GET | `/authentication/reset/request_reset_link` | `my-workspace/api/authentication/reset/request_reset_link_GET.xs` |
| POST | `/authentication/reset/update_password` | `my-workspace/api/authentication/reset/update_password_POST.xs` |
| POST | `/authentication/sync_course` | `my-workspace/api/authentication/sync_course_POST.xs` |
| POST | `/courses/add_entitlement` | `my-workspace/api/courses/add_entitlement_POST.xs` |
| POST | `/courses/auth/login` | `my-workspace/api/courses/auth/login_POST.xs` |
| GET | `/courses/auth/me` | `my-workspace/api/courses/auth/me_GET.xs` |
| POST | `/courses/find_or_create_student` | `my-workspace/api/courses/find_or_create_student_POST.xs` |
| GET | `/courses/get_all_categories` | `my-workspace/api/courses/get_all_categories_GET.xs` |
| GET | `/courses/get_all_courses` | `my-workspace/api/courses/get_all_courses_GET.xs` |
| GET | `/courses/get_books` | `my-workspace/api/courses/get_books_GET.xs` |
| GET | `/courses/get_brain_teasers` | `my-workspace/api/courses/get_brain_teasers_GET.xs` |
| GET | `/courses/get_bytes` | `my-workspace/api/courses/get_bytes_GET.xs` |
| GET | `/courses/get_current_affairs` | `my-workspace/api/courses/get_current_affairs_GET.xs` |
| GET | `/courses/get_entitlements` | `my-workspace/api/courses/get_entitlements_GET.xs` |
| GET | `/courses/get_student_courses` | `my-workspace/api/courses/get_student_courses_GET.xs` |
| GET | `/courses/get_user_entitled_content` | `my-workspace/api/courses/get_user_entitled_content_GET.xs` |
| GET | `/courses/get_workshops` | `my-workspace/api/courses/get_workshops_GET.xs` |
| POST | `/courses/issue_certificate` | `my-workspace/api/courses/issue_certificate_POST.xs` |
| POST | `/courses/submit_quiz_attempt` | `my-workspace/api/courses/submit_quiz_attempt_POST.xs` |
| POST | `/courses/sync_course` | `my-workspace/api/courses/sync_course_POST.xs` |
| POST | `/courses/update_student_progress` | `my-workspace/api/courses/update_student_progress_POST.xs` |
| POST | `/courses/upsert_entitlement` | `my-workspace/api/courses/upsert_entitlement_POST.xs` |
| GET | `/event_logs/logs/admin/account_events` | `my-workspace/api/event_logs/logs/admin/account_events_GET.xs` |
| GET | `/event_logs/logs/user/my_events` | `my-workspace/api/event_logs/logs/user/my_events_GET.xs` |
| GET | `/members_accounts/account/details` | `my-workspace/api/members_accounts/account/details_GET.xs` |
| GET | `/members_accounts/account/my_team_members` | `my-workspace/api/members_accounts/account/my_team_members_GET.xs` |
| POST | `/members_accounts/account` | `my-workspace/api/members_accounts/account_POST.xs` |
| POST | `/members_accounts/admin/user_role` | `my-workspace/api/members_accounts/admin/user_role_POST.xs` |
| GET | `/members_accounts/get_all_grades` | `my-workspace/api/members_accounts/get_all_grades_GET.xs` |
| GET | `/members_accounts/get_all_schools` | `my-workspace/api/members_accounts/get_all_schools_GET.xs` |
| GET | `/members_accounts/get_all_users` | `my-workspace/api/members_accounts/get_all_users_GET.xs` |
| PATCH | `/members_accounts/user/edit_profile` | `my-workspace/api/members_accounts/user/edit_profile_PATCH.xs` |
| POST | `/members_accounts/user/join_account` | `my-workspace/api/members_accounts/user/join_account_POST.xs` |

## API Group Files (Non-endpoint)

These files define API groups in Xano and are not standalone endpoints:

- `my-workspace/api/authentication/authentication.xs`
- `my-workspace/api/courses/courses.xs`
- `my-workspace/api/event_logs/event_logs.xs`
- `my-workspace/api/members_accounts/members_accounts.xs`

## Database Tables

Total table files: **14**

| Table | Source File |
|---|---|
| `book` | `my-workspace/table/book.xs` |
| `brain_teaser` | `my-workspace/table/brain_teaser.xs` |
| `byte` | `my-workspace/table/byte.xs` |
| `chapter` | `my-workspace/table/chapter.xs` |
| `course` | `my-workspace/table/course.xs` |
| `course_grade` | `my-workspace/table/course_grade.xs` |
| `current_affair` | `my-workspace/table/current_affair.xs` |
| `enrollment` | `my-workspace/table/enrollment.xs` |
| `entitlement` | `my-workspace/table/entitlement.xs` |
| `grade` | `my-workspace/table/grade.xs` |
| `school` | `my-workspace/table/school.xs` |
| `student` | `my-workspace/table/student.xs` |
| `student_progress` | `my-workspace/table/student_progress.xs` |
| `workshop` | `my-workspace/table/workshop.xs` |
