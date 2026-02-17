<?php

namespace App\Actions\Notes;

use App\Models\Note;
use App\Models\User;
use Carbon\CarbonImmutable;

class CreateNoteAction
{
    public function execute(User $user, string $content): Note
    {
        return $user->notes()->create([
            'content' => $content,
            'note_date' => CarbonImmutable::now(),
        ]);
    }
}
