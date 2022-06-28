export const getBadge = (status: string) => {
  if (status === 'ACTIVE') {
    return 'success';
  } else {
    if (status === 'PAUSED') {
      return 'warning';
    } else {
      return 'critical';
    }
  }
};
