import { APIRouter } from "../router-class"
import { UserRepository } from "../../../db/repositories/user"

const router = new APIRouter()

router.get("/verify_credentials", async ctx => {
    await ctx.send(UserRepository, ctx.state.token.user)
})

export default router