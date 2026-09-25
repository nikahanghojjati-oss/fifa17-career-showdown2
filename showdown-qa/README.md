# Showdown QA & Reliability

This is the setup and review workspace for the Career Mode Showdown QA & Reliability project.

## Purpose

Provide evidence-based, bounded work on bug reports and test findings: extract errors, classify reports, reproduce failures, summarize test results, identify likely causes, and prepare focused fix candidates with regression evidence.

The Career Mode authority remains responsible for deciding which candidate fixes are implemented or integrated into the product.

## Project setup

- ChatGPT Project name: **Showdown QA & Reliability**
- Preferred model: **GPT-6 Luna Max** for new QA chats, when available on your plan.
- Select the model in the conversation model picker after opening the project. Project instructions express this preference but cannot select or enforce the model.
- Paste the contents of **CHATGPT_PROJECT_INSTRUCTIONS.md** into the ChatGPT Project's Instructions field.
- Repository folder: **showdown-qa/**
- Setup branch: **project/showdown-qa-reliability**

## Authority and review

This project is a sibling review workstream. It does not merge to main, deploy, or declare a product fix shipped. Candidate code changes, when explicitly assigned, belong on a separate review branch and require review by the Career Mode authority before integration.

The repository root AGENTS.md and current POS20 operating documents control repository work. Re-resolve live branch heads and current product guards before each task; saved hashes and old handoffs are not live authority.

## Evidence standard

Every finding should distinguish observed facts from hypotheses, cite the exact commit or run where possible, and state what evidence would confirm the diagnosis. Never claim a bug is fixed without a regression check on the exact candidate head. CI, emulator, review, merge, and deployment evidence must not be represented as production two-account evidence or as SSJR/MDP credit.

## Current setup change

This branch adds project guidance only. No application code, tests, product state, or deployment configuration has been changed.