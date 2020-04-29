const SDK = require('@yuque/sdk');
const config = require("./config");
const fs = require('fs-extra');

const client = new SDK({
    token: config.token,
});
const { users, repos, docs } = client;
let filearr = [];

const option = {
    include: [],
    exclude: [],
}
//获取仓库列表信息
async function test(option) {
    // 获得用户信息
    let userinfo = await users.get()
    //获得用户仓库列表
    let repoArr = await repos.list({ user: userinfo.login });
    let sel_repo = [];
    repoArr.map((item) => {
        // if (option['include'].indexOf(item.slug) >= 0) {
            sel_repo.push({
                repoSlug: item.slug,
                name: item.name
            })
        // }

    });
    for (let i = 0; i < sel_repo.length; i++) {
        let item = sel_repo[i];
        let tocRes = await repos.getTOC({ namespace: `${userinfo.login}/${item.repoSlug}` });
        filearr = filearr.concat(handleTocFile(tocRes, item.repoSlug));
    }
    for (let j = 0; j < filearr.length; j++) {
        let item = filearr[j]
        await fs.mkdirp(item.folder);
        try {
            let filehtml = await docs.get({ namespace: `${userinfo.login}/${item.repoSlug}`, slug: item.slug });
            await fs.writeFile(`./${item.folder}/${item.slug}.html`, filehtml.body_html);
        } catch (error) {
            if (error.status == 404) {
                console.log("无效文件", item.title);
            }

        }

    }
}

// 处理每个仓库中的文件
function handleTocFile(tocRes, repoSlug) {
    let firstCont = '';
    let filearr = [];
    tocRes.forEach((item) => {
        if (item.slug == '#' || item.depth == 1 || !item.depth) {
            firstCont = item.slug == '#' ? item.title : item.slug;
        } else {
            item.folder = `./${repoSlug}${firstCont == '' ? '' : '/' + firstCont}`;
            item.repoSlug = repoSlug;
            filearr.push(item);
        }

    });
    return filearr;
}


test(option).catch((error) => { console.log(error) });