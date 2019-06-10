import Router from "koa-router"
import { WebRouterState, WebRouterCustom } from ".."
import { getRepository } from "typeorm"
import { Application } from "../../../db/entities/application"
import $ from "cafy"
import { randomBytes } from "crypto"
import koaBody = require("koa-body")
import { checkCsrf } from "../../../utils/checkCsrf"

const router = new Router<WebRouterState, WebRouterCustom>()

router.get("/", async ctx => {
    const session = ctx.state.session
    if (session == null) throw "please login"
    const myOwnedApps = await getRepository(Application).find({
        ownerUser: session.user,
    })
    ctx.render("settings/my_developed_applications/index", { myOwnedApps })
})

router.get("/new", async ctx => {
    ctx.render("settings/my_developed_applications/new")
})

router.post("/new", koaBody(), checkCsrf, async ctx => {
    const session = ctx.state.session
    if (session == null) throw "please login"

    const body = $.obj({
        name: $.str.min(1).max(32),
        description: $.str.min(1),
        redirect_uri: $.str,
    })
        .strict()
        .throw(ctx.request.body)
    const app = new Application()
    app.name = body.name
    app.description = body.description
    app.redirectUri = body.redirect_uri
    app.clientId = randomBytes(32).toString("hex")
    app.clientSecret = randomBytes(32).toString("hex")
    app.ownerUser = session.user
    await getRepository(Application).save(app)
    ctx.redirect("/settings/my_developed_applications/" + app.id)
})

router.get("/:id", async ctx => {
    const { id } = $.obj({
        id: $.str.match(/^[0-9]+$/),
    }).throw(ctx.params)
    const app = await getRepository(Application).findOneOrFail(id, {
        relations: ["ownerUser"],
    })
    if (app.ownerUser.id != ctx.state.session!.user.id) return ctx.throw(403, "お前ownerじゃねえだろ")
    ctx.render("settings/my_developed_applications/show", { app })
})

router.post("/:id", koaBody(), checkCsrf, async ctx => {
    const { id } = $.obj({
        id: $.str.match(/^[0-9]+$/),
    }).throw(ctx.params)
    const body = $.obj({
        name: $.str.min(1).max(32),
        description: $.str.min(1),
        redirect_uri: $.str,
        is_automated: $.str.or("1").makeOptional(),
    }).throw(ctx.request.body)
    const app = await getRepository(Application).findOneOrFail(id, {
        relations: ["ownerUser"],
    })
    if (app.ownerUser.id != ctx.state.session!.user.id) return ctx.throw(403, "お前ownerじゃねえだろ")
    app.name = body.name
    app.description = body.description
    app.redirectUri = body.redirect_uri
    app.isAutomated = body.is_automated != undefined
    await getRepository(Application).save(app)
    ctx.redirect("/settings/my_developed_applications/" + app.id)
})

export default router
