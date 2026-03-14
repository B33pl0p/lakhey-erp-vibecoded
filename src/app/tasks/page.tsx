import { getJobTasks } from "@/lib/api/jobTasks";
import { JobTaskTable } from "@/components/tasks/JobTaskTable";
import Link from "next/link";
import { Plus } from "lucide-react";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const tasks = await getJobTasks();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Job Tracker</h1>
          <p className={styles.subtitle}>Track customer jobs, deadlines, and who&apos;s assigned to what.</p>
        </div>
        <Link href="/tasks/new" className={styles.newBtn}>
          <Plus size={16} />
          New Task
        </Link>
      </div>

      <JobTaskTable tasks={tasks} />
    </div>
  );
}
