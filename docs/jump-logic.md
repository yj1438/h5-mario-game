Jump buffering and coyote time implementation details.

The jump logic was updated to use a queuing system (`jumpQueued`) to ensure that jumps are registered even if the button press occurs slightly before hitting the ground, while preventing multiple jumps from a single press via `jumpConsumedUntilRelease`.