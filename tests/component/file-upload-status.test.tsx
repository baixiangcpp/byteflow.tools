import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { FILE_INPUT_POLICIES } from "@/core/files/file-input-policy"
import { FileUploadStatus } from "@/features/tool-shell/file-upload-status"

vi.mock("@/core/i18n/lang-provider", () => ({
    useLang: () => ({
        t: {
            common: {
                accepted_input: "Accepted input",
                cancel: "Cancel",
                file_upload_requirements: "Upload requirements",
                max_file_size: "Max file size",
                max_resolution: "Max resolution",
                processing_file_locally: "Processing file locally...",
            },
        },
    }),
}))

describe("FileUploadStatus", () => {
    it("announces upload status and exposes accessible progress", () => {
        render(
            <FileUploadStatus
                policy={FILE_INPUT_POLICIES["image-standard"]}
                status="loading"
                message="Loading file locally..."
                progress={50}
                onCancel={vi.fn()}
            />,
        )

        expect(screen.getByRole("status")).toHaveTextContent("Loading file locally...")
        expect(screen.getByRole("progressbar", { name: "Loading file locally..." })).toHaveAttribute("aria-valuenow", "50")
        expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
    })
})
