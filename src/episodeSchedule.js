function episodeDateForState(date) {
	const episodeDate = new Date(date);
	if (Number.isNaN(episodeDate.getTime())) {
		throw new Error(`Cannot store invalid episode date: ${date}`);
	}

	// Preserve the existing KV convention: the episode date at the 16:00 check time.
	episodeDate.setUTCHours(16, 0, 0, 0);
	return episodeDate;
}

export { episodeDateForState };
