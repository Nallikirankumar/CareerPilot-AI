import React, { useState, useEffect } from 'react';

// Curated verified resources and structured roadmap tasks for popular engineering skills
const CURATED_RESOURCES = {
  Docker: {
    docs: 'https://docs.docker.com/get-started/',
    exercise: 'Containerize a Python FastAPI application with a multi-stage Dockerfile and Docker Compose.',
    project: 'Microservice container cluster with Nginx reverse proxy and PostgreSQL database container.',
    stage: 'Intermediate'
  },
  Kubernetes: {
    docs: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/',
    exercise: 'Deploy a replicated web app using Pods, Deployments, and a ClusterIP Service in Minikube.',
    project: 'Auto-scaling web service with ConfigMaps, Secrets, and rolling update deployments.',
    stage: 'Advanced'
  },
  Redis: {
    docs: 'https://redis.io/docs/latest/develop/get-started/',
    exercise: 'Implement response caching and rate-limiting middleware in Python using Redis keys and TTL.',
    project: 'Real-time leaderboard and Pub/Sub chat notification broker.',
    stage: 'Intermediate'
  },
  AWS: {
    docs: 'https://aws.amazon.com/getting-started/',
    exercise: 'Deploy a serverless REST endpoint using AWS Lambda, API Gateway, and S3 bucket storage.',
    project: 'Cloud-native backend architecture with EC2/ECS, RDS PostgreSQL, and CloudWatch metrics.',
    stage: 'Intermediate'
  },
  PostgreSQL: {
    docs: 'https://www.postgresql.org/docs/current/tutorial.html',
    exercise: 'Write complex SQL queries using JOINs, Window Functions, and analyze execution plans with EXPLAIN ANALYZE.',
    project: 'E-commerce schema with ACID transactions, indexing optimizations, and row-level locks.',
    stage: 'Foundational'
  },
  React: {
    docs: 'https://react.dev/learn',
    exercise: 'Build an interactive dashboard with custom hooks, state management, and accessible form validation.',
    project: 'Full-stack SaaS interface with Dark/Light theme toggle, debounced search, and pagination.',
    stage: 'Foundational'
  },
  FastAPI: {
    docs: 'https://fastapi.tiangolo.com/tutorial/',
    exercise: 'Build asynchronous REST APIs with Pydantic v2 schemas, dependency injection, and JWT security.',
    project: 'Production-ready career analyzer API with file upload streaming and background task queues.',
    stage: 'Foundational'
  },
  'Machine Learning': {
    docs: 'https://scikit-learn.org/stable/getting_started.html',
    exercise: 'Implement cross-validation, feature scaling, and evaluate classification metrics (F1-score, ROC-AUC).',
    project: 'End-to-end predictive pipeline with Scikit-learn and automated feature preprocessing.',
    stage: 'Intermediate'
  },
  'System Design': {
    docs: 'https://github.com/donnemartin/system-design-primer',
    exercise: 'Design a distributed URL shortener or rate limiter handling 100k requests per second.',
    project: 'High-availability system architecture document with load balancing, caching, and database replication.',
    stage: 'Advanced'
  }
};

export default function RoadmapView({ result, onProgressUpdate }) {
  const missingSkills = result?.analysis?.missing_skills || [];
  const hasAnalysis = Boolean(result && result.analysis);

  // If no missing skills or no analysis, use sample target skills
  const activeSkills = (hasAnalysis && missingSkills.length > 0)
    ? missingSkills
    : ['Docker', 'Kubernetes', 'Redis', 'System Design'];

  // Stored completed task IDs in localStorage
  const [completedTasks, setCompletedTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('careerpilot_roadmap_completed');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Calculate total roadmap tasks
  const totalTasks = activeSkills.length * 3; // 3 tasks per skill (Theory, Exercise, Mini-Project)
  const completedCount = Object.values(completedTasks).filter(Boolean).length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  useEffect(() => {
    try {
      localStorage.setItem('careerpilot_roadmap_completed', JSON.stringify(completedTasks));
    } catch {
      // Ignore storage errors
    }
    if (onProgressUpdate) {
      onProgressUpdate(progressPercentage);
    }
  }, [completedTasks, progressPercentage, onProgressUpdate]);

  const toggleTask = (taskId) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const resetProgress = () => {
    setCompletedTasks({});
  };

  return (
    <div className="workspace-view" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="hero">
        <div className="hero-pill">
          <span>●</span> Module E • Personalized Learning Roadmap
        </div>
        <h1 className="hero-title">
          Targeted <span className="gradient-text">Skill Acquisition Roadmap</span>
        </h1>
        <p className="hero-desc">
          Structured learning pathways generated from your diagnosed technical skill gaps. 
          Follow clear milestones from fundamentals to hands-on exercises and mini-projects.
        </p>
      </div>

      {/* Progress & Milestone Overview */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.25rem' }}>
        <div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Roadmap Milestone Progress</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.2rem' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-400)' }}>
              {progressPercentage}%
            </span>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              ({completedCount} of {totalTasks} learning tasks completed)
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="preset-btn"
            onClick={resetProgress}
            style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}
            title="Reset roadmap checklist"
          >
            Reset Progress
          </button>
        </div>
      </div>

      {/* Progress Track */}
      <div className="category-progress-track" style={{ height: '8px' }}>
        <div
          className="category-progress-fill"
          style={{ width: `${progressPercentage}%`, backgroundColor: 'var(--primary-500)' }}
        />
      </div>

      {!hasAnalysis && (
        <div style={{ padding: '0.75rem 1.25rem', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: 'var(--radius-md)', color: 'var(--warning-text)', fontSize: '0.85rem' }}>
          💡 <strong>Demo Mode:</strong> Displaying standard roadmap pathways for Core Backend & Cloud skills. Upload your resume in the <strong>Analysis Workspace</strong> to generate a custom roadmap matching your target role!
        </div>
      )}

      {/* Roadmap Skill Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {activeSkills.map((skill, index) => {
          const resource = CURATED_RESOURCES[skill] || {
            docs: `https://www.google.com/search?q=${encodeURIComponent(skill + ' official documentation tutorial')}`,
            exercise: `Complete 3 hands-on programming exercises implementing ${skill} core patterns.`,
            project: `Build and deploy a working application incorporating ${skill}.`,
            stage: 'Skill Gap'
          };

          const task1Id = `${skill}_theory`;
          const task2Id = `${skill}_exercise`;
          const task3Id = `${skill}_project`;

          const skillCompleted = Boolean(completedTasks[task1Id] && completedTasks[task2Id] && completedTasks[task3Id]);

          return (
            <div key={skill} className="card" style={{ borderColor: skillCompleted ? 'var(--success-border)' : 'var(--border-subtle)' }}>
              <div className="card-header">
                <div className="card-title">
                  <span className="card-icon" style={{ color: skillCompleted ? 'var(--success-text)' : 'var(--primary-400)' }}>
                    {skillCompleted ? '✓' : `${index + 1}`}
                  </span>
                  {skill}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className="badge badge-phase">
                    {resource.stage}
                  </span>
                  <a
                    href={resource.docs}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="preset-btn"
                    style={{ color: 'var(--primary-400)', textDecoration: 'none' }}
                  >
                    Official Docs ↗
                  </a>
                </div>
              </div>

              {/* Checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                {/* Step 1 */}
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', fontSize: '0.88rem' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(completedTasks[task1Id])}
                    onChange={() => toggleTask(task1Id)}
                    style={{ marginTop: '0.2rem', accentColor: 'var(--primary-500)', cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <div>
                    <span style={{ fontWeight: 600, color: completedTasks[task1Id] ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: completedTasks[task1Id] ? 'line-through' : 'none' }}>
                      Milestone 1: Core Fundamentals & Architectural Concepts
                    </span>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Review core mental models, syntax, and lifecycle patterns in the official documentation.
                    </p>
                  </div>
                </label>

                {/* Step 2 */}
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', fontSize: '0.88rem' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(completedTasks[task2Id])}
                    onChange={() => toggleTask(task2Id)}
                    style={{ marginTop: '0.2rem', accentColor: 'var(--primary-500)', cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <div>
                    <span style={{ fontWeight: 600, color: completedTasks[task2Id] ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: completedTasks[task2Id] ? 'line-through' : 'none' }}>
                      Milestone 2: Coding Exercise & Practical Implementation
                    </span>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {resource.exercise}
                    </p>
                  </div>
                </label>

                {/* Step 3 */}
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', fontSize: '0.88rem' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(completedTasks[task3Id])}
                    onChange={() => toggleTask(task3Id)}
                    style={{ marginTop: '0.2rem', accentColor: 'var(--primary-500)', cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <div>
                    <span style={{ fontWeight: 600, color: completedTasks[task3Id] ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: completedTasks[task3Id] ? 'line-through' : 'none' }}>
                      Milestone 3: Portfolio Mini-Project Challenge
                    </span>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {resource.project}
                    </p>
                  </div>
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
