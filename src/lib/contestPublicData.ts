export function contestPublicFields(data: Record<string, unknown>) {
  return {
    title: data.title,
    description: data.description,
    instructions: data.instructions,
    startsAt: data.startsAt,
    endsAt: data.endsAt,
    problemIds: data.problemIds,
    ownerName: data.ownerName,
    status: data.status,
    scorePerProblem: data.scorePerProblem,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    publishedAt: data.publishedAt,
    cancelledAt: data.cancelledAt,
    hasAccessCode: Boolean(data.accessCodeHash),
  };
}
