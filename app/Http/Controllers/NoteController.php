<?php

namespace App\Http\Controllers;

use App\Actions\Notes\CreateNoteAction;
use App\Actions\Notes\DeleteNoteAction;
use App\Http\Requests\StoreNoteRequest;
use App\Models\Note;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NoteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notes = $request->user()
            ->notes()
            ->latest('note_date')
            ->get()
            ->map(fn (Note $note): array => [
                'id' => (string) $note->id,
                'content' => $note->content,
                'date' => $note->note_date->format('Y-m-d H:i'),
            ]);

        return response()->json(['data' => $notes]);
    }

    public function store(StoreNoteRequest $request, CreateNoteAction $action): JsonResponse
    {
        $note = $action->execute($request->user(), $request->string('content')->toString());

        return response()->json([
            'data' => [
                'id' => (string) $note->id,
                'content' => $note->content,
                'date' => $note->note_date->format('Y-m-d H:i'),
            ],
        ], 201);
    }

    public function destroy(Request $request, Note $note, DeleteNoteAction $action): JsonResponse
    {
        abort_if($note->user_id !== $request->user()->id, 403);
        $action->execute($note);

        return response()->json(['message' => 'Nota eliminada correctamente.']);
    }
}
