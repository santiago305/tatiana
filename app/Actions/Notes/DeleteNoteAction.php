<?php

namespace App\Actions\Notes;

use App\Models\Note;

class DeleteNoteAction
{
    public function execute(Note $note): void
    {
        $note->delete();
    }
}
